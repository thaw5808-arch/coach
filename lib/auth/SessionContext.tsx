"use client";

import { migrateAddress } from "@/lib/address/countries";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/*
 * Front-end-only mock auth — the single home for every session concern (Account page, checkout saved addresses,
 * order-page "create account"). There is no server: accounts live in this browser's localStorage.
 *
 * ⚠️ DEMO ONLY — NOT REAL SECURITY. Passwords are never stored in plain text: we keep a salted SHA-256 digest
 * (Web Crypto) purely so a sign-in can be checked. A fast unsalted-per-user hash in client storage would be
 * unacceptable for a real product (use a server, a slow KDF like Argon2/bcrypt, and HTTP-only cookies).
 */

/** `country` is an ISO code and `state` a region code (lib/address/countries.ts) — display with formatCityLine(). */
export type SavedAddress = {
  id: string;
  /** Nickname shown in checkout, e.g. "Home". */
  label: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};
export type AddressInput = Omit<SavedAddress, "id"> & { id?: string };

/** What's kept as "the session" — the signed-in person, no secrets. */
export type Session = { email: string; firstName: string; lastName: string; createdAt: string };

/** A registered account (registry entry). `passwordHash` never leaves this module. */
type AccountRecord = Session & {
  passwordHash: string;
  emailOptIn: boolean;
  addresses: SavedAddress[];
  defaultAddressId: string | null;
  /** Product ids — merged with the device wishlist on sign-in (lib/wishlist/WishlistContext.tsx). */
  wishlist?: string[];
};
export type Account = Omit<AccountRecord, "passwordHash">;

export type AuthResult = { ok: true } | { ok: false; error: string };

const SESSION_KEY = "coach.session.v1";
const ACCOUNTS_KEY = "coach.accounts.v1";
/** One message for every failed sign-in — never reveal whether the email or the password was wrong. */
export const SIGN_IN_ERROR = "That email and password don’t match. Try again or reset your password.";
export const PASSWORD_RULE = "Use at least 8 characters, including a number.";

export function validatePassword(value: string): string | null {
  return value.length < 8 || !/\d/.test(value) ? PASSWORD_RULE : null;
}
export function validateEmail(value: string): string | null {
  if (!value.trim()) return "Please enter your email.";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? null : "Please enter a valid email address.";
}
const normalise = (email: string) => email.trim().toLowerCase();

async function hashPassword(email: string, password: string) {
  // Demo-only: salted with the account email so equal passwords don't share a digest. See the note at the top.
  const data = new TextEncoder().encode(`coach-demo:${normalise(email)}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function readAccounts(): Record<string, AccountRecord> {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, AccountRecord>) : {};
    if (!parsed || typeof parsed !== "object") return {};
    // Addresses saved before country/region codes stored full names ("United States", "New York") — map on read.
    for (const record of Object.values(parsed)) record.addresses = (record.addresses ?? []).map(migrateAddress);
    return parsed;
  } catch {
    return {};
  }
}
function writeAccounts(accounts: Record<string, AccountRecord>) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    /* storage blocked — the account lives for this page view only */
  }
}
/** "Keep me signed in" → localStorage; otherwise the session ends with the tab (sessionStorage). */
function readSession(): Session | null {
  for (const store of [localStorage, sessionStorage]) {
    try {
      const raw = store.getItem(SESSION_KEY);
      if (!raw) continue;
      const s = JSON.parse(raw) as Partial<Session>;
      // Legacy pre-Account sessions were just { email } with no registry entry — treat as signed out.
      if (s?.email && s.firstName !== undefined && readAccounts()[normalise(s.email)]) return s as Session;
    } catch {
      /* ignore */
    }
  }
  return null;
}
function writeSession(session: Session | null, remember = true) {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    if (session) (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}
const toSession = (a: AccountRecord): Session => ({ email: a.email, firstName: a.firstName, lastName: a.lastName, createdAt: a.createdAt });
const toAccount = ({ passwordHash: _hash, ...rest }: AccountRecord): Account => rest;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

type SessionContextValue = {
  hydrated: boolean;
  session: Session | null;
  account: Account | null;
  signIn: (email: string, password: string, remember?: boolean) => Promise<AuthResult>;
  createAccount: (input: { email: string; firstName: string; lastName: string; password: string; emailOptIn?: boolean; address?: AddressInput }) => Promise<AuthResult>;
  signOut: () => void;
  /** Simulated — resolves the same way whether or not the email has an account (no account enumeration). */
  requestPasswordReset: (email: string) => Promise<void>;
  updateProfile: (patch: Partial<Pick<Account, "firstName" | "lastName" | "emailOptIn">>) => void;
  saveAddress: (address: AddressInput) => SavedAddress | null;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  saveWishlist: (ids: string[]) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [record, setRecord] = useState<AccountRecord | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    const s = readSession();
    setSession(s);
    setRecord(s ? (readAccounts()[normalise(s.email)] ?? null) : null);
  }, []);

  useEffect(() => {
    refresh();
    setHydrated(true);
    // Another tab signed in / out or edited the account.
    const onStorage = (e: StorageEvent) => {
      if (e.key === SESSION_KEY || e.key === ACCOUNTS_KEY) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const mutate = useCallback(
    (fn: (a: AccountRecord) => AccountRecord) => {
      if (!session) return null;
      const accounts = readAccounts();
      const key = normalise(session.email);
      const current = accounts[key];
      if (!current) return null;
      const next = fn(current);
      accounts[key] = next;
      writeAccounts(accounts);
      setRecord(next);
      const nextSession = toSession(next);
      if (nextSession.firstName !== session.firstName || nextSession.lastName !== session.lastName) {
        writeSession(nextSession, localStorage.getItem(SESSION_KEY) !== null);
        setSession(nextSession);
      }
      return next;
    },
    [session],
  );

  const signIn = useCallback(async (email: string, password: string, remember = true): Promise<AuthResult> => {
    await delay(600); // simulated network round trip (loading state)
    const account = readAccounts()[normalise(email)];
    const hash = await hashPassword(email, password);
    if (!account || account.passwordHash !== hash) return { ok: false, error: SIGN_IN_ERROR };
    writeSession(toSession(account), remember);
    setSession(toSession(account));
    setRecord(account);
    return { ok: true };
  }, []);

  const createAccount = useCallback<SessionContextValue["createAccount"]>(async ({ email, firstName, lastName, password, emailOptIn = false, address }) => {
    const pwError = validatePassword(password);
    if (pwError) return { ok: false, error: pwError };
    await delay(600);
    const accounts = readAccounts();
    const key = normalise(email);
    if (accounts[key]) return { ok: false, error: "There’s already an account for this email. Sign in instead." };
    const addresses = address ? [{ ...address, id: address.id ?? crypto.randomUUID() }] : [];
    const record: AccountRecord = {
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      createdAt: new Date().toISOString(),
      passwordHash: await hashPassword(email, password),
      emailOptIn,
      addresses,
      defaultAddressId: addresses[0]?.id ?? null,
    };
    accounts[key] = record;
    writeAccounts(accounts);
    writeSession(toSession(record));
    setSession(toSession(record));
    setRecord(record);
    return { ok: true };
  }, []);

  const signOut = useCallback(() => {
    writeSession(null); // the bag, wishlist and orders stay — they belong to this device
    setSession(null);
    setRecord(null);
  }, []);

  const requestPasswordReset = useCallback(async (_email: string) => {
    await delay(700);
  }, []);

  const updateProfile = useCallback<SessionContextValue["updateProfile"]>((patch) => void mutate((a) => ({ ...a, ...patch })), [mutate]);

  const saveAddress = useCallback<SessionContextValue["saveAddress"]>(
    (input) => {
      const id = input.id ?? crypto.randomUUID();
      const address: SavedAddress = { ...input, id, address2: input.address2 || undefined };
      const next = mutate((a) => {
        const exists = a.addresses.some((x) => x.id === id);
        const addresses = exists ? a.addresses.map((x) => (x.id === id ? address : x)) : [...a.addresses, address];
        return { ...a, addresses, defaultAddressId: a.defaultAddressId ?? id };
      });
      return next ? address : null;
    },
    [mutate],
  );

  const deleteAddress = useCallback(
    (id: string) =>
      void mutate((a) => {
        const addresses = a.addresses.filter((x) => x.id !== id);
        return { ...a, addresses, defaultAddressId: a.defaultAddressId === id ? (addresses[0]?.id ?? null) : a.defaultAddressId };
      }),
    [mutate],
  );

  const setDefaultAddress = useCallback((id: string) => void mutate((a) => ({ ...a, defaultAddressId: id })), [mutate]);
  const saveWishlist = useCallback((wishlist: string[]) => void mutate((a) => ({ ...a, wishlist })), [mutate]);

  const value = useMemo<SessionContextValue>(
    () => ({
      hydrated,
      session,
      account: record ? toAccount(record) : null,
      signIn,
      createAccount,
      signOut,
      requestPasswordReset,
      updateProfile,
      saveAddress,
      deleteAddress,
      setDefaultAddress,
      saveWishlist,
    }),
    [hydrated, session, record, signIn, createAccount, signOut, requestPasswordReset, updateProfile, saveAddress, deleteAddress, setDefaultAddress, saveWishlist],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}

/** `?next=` must be a same-site path — never an absolute / protocol-relative URL (no open redirects). */
export function safeNextPath(next: string | null | undefined, fallback = "/account"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  try {
    const url = new URL(next, "https://coach.invalid");
    if (url.origin !== "https://coach.invalid") return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}

/** "Home — Tim Archer" — how saved addresses are titled in checkout and the account page. */
export const addressTitle = (a: SavedAddress) => `${a.label || "Address"} — ${a.firstName} ${a.lastName}`.trim();
