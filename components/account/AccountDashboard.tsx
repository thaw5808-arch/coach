"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "@/components/ui/SiteLink";
import { FormField } from "@/components/checkout/FormField";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { CutoutImage } from "@/components/ui/CutoutImage";
import { countryName, formatCityLine, HOME_COUNTRY } from "@/lib/address/countries";
import { useSession, type Account } from "@/lib/auth/SessionContext";
import { formatPrice, numberWord } from "@/lib/format";
import { getOrdersByEmail, type Order } from "@/lib/orders";
import { getOrderStatusSummary } from "@/lib/orderStatus";
import { getProductById } from "@/lib/products";
import { useWishlist } from "@/lib/wishlist/WishlistContext";
import { AddressBook } from "./AddressBook";
import { SERVICE_LABELS, readAppointments, type Appointment } from "@/lib/appointments";
import { formatMinutes, getStoreById } from "@/lib/stores";

export type AccountTab = "overview" | "orders" | "addresses" | "details";
export const ACCOUNT_TABS: { key: AccountTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "orders", label: "Orders" },
  { key: "addresses", label: "Addresses" },
  { key: "details", label: "Account Details" },
];

const word = numberWord;
const panel = "rounded-[24px] bg-surface";

function greeting(now = new Date()) {
  const h = now.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function orderTitle(order: Order) {
  const names = [...new Set(order.lines.map((l) => l.name))];
  if (names.length <= 2) return names.join(" & ");
  return `${names[0]}, ${names[1]} & ${names.length - 2} more`;
}

function OrderThumb({ productId, size = 96 }: { productId: string; size?: number }) {
  const product = getProductById(productId);
  const image = product?.colours[0].image;
  return (
    <span className="relative block shrink-0 overflow-hidden rounded-[16px] bg-blob" style={{ width: size, height: size }}>
      {image && (
        <span className="absolute inset-[6.25%]">
          <CutoutImage image={image} alt="" sizes={`${size}px`} />
        </span>
      )}
    </span>
  );
}

/** Figma "Card / Latest Order" (94:198). */
function LatestOrderCard({ order }: { order: Order }) {
  const status = getOrderStatusSummary(order);
  return (
    <div className={`${panel} flex w-full flex-col items-start gap-5 p-6 desk:flex-row desk:items-center desk:gap-6 desk:p-8`}>
      <OrderThumb productId={order.lines[0]?.productId ?? ""} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="type-badge text-accent-deep">LATEST ORDER · Nº {order.id}</p>
        <p className="type-h3 text-ink">{orderTitle(order)}</p>
        <p className="type-caption text-ink-muted">{status.detail}</p>
      </div>
      <Button href={`/order/${order.id}`} variant="secondary" className="border border-line desk:border-0">
        {order.status === "cancelled" ? "View order" : "Track order"}
      </Button>
    </div>
  );
}

function SmallCard({ eyebrow, children, action }: { eyebrow: string; children: React.ReactNode; action: React.ReactNode }) {
  return (
    <div className={`${panel} flex w-full flex-col items-start gap-2.5 p-7`}>
      <p className="type-badge text-accent-deep">{eyebrow}</p>
      <div className="type-body flex-1 text-ink">{children}</div>
      {action}
    </div>
  );
}

function Overview({ account, orders, goTo }: { account: Account; orders: Order[]; goTo: (tab: AccountTab) => void }) {
  const wishlist = useWishlist();
  const [hello, setHello] = useState("Welcome back");
  useEffect(() => setHello(greeting()), []); // time of day is client-only — avoids a hydration mismatch
  const onWay = orders.filter((o) => o.status !== "cancelled" && getOrderStatusSummary(o).onItsWay).length;
  const saved = wishlist.ids.map((id) => getProductById(id)?.name).filter(Boolean) as string[];
  const defaultAddress = account.addresses.find((a) => a.id === account.defaultAddressId);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  useEffect(() => {
    const nowMs = Date.now();
    setUpcoming(
      readAppointments()
        .filter((a) => a.email.trim().toLowerCase() === account.email.toLowerCase() && new Date(`${a.date}T00:00`).getTime() + a.minutes * 60_000 > nowMs)
        .sort((a, b) => (a.date + String(a.minutes).padStart(4, "0")).localeCompare(b.date + String(b.minutes).padStart(4, "0"))),
    );
  }, [account.email]);

  const ordersPhrase = onWay === 0 ? "No orders on their way" : `${word(onWay)} order${onWay === 1 ? "" : "s"} on ${onWay === 1 ? "its" : "their"} way`;
  const savedPhrase = saved.length === 0 ? "nothing saved for later yet" : `${word(saved.length).toLowerCase()} piece${saved.length === 1 ? "" : "s"} saved for later`;

  return (
    <>
      <div className="flex flex-col items-start gap-2">
        <p className="type-eyebrow text-accent-deep">MY COACH</p>
        <h1 className="type-h1-mobile text-ink desk:type-h1">
          {hello}, {account.firstName}.
        </h1>
        <p className="type-body text-ink-muted">
          {ordersPhrase} and {savedPhrase}.
        </p>
      </div>
      {orders[0] ? (
        <LatestOrderCard order={orders[0]} />
      ) : (
        <div className={`${panel} flex w-full flex-col items-start gap-3 p-6 desk:p-8`}>
          <p className="type-badge text-accent-deep">ORDERS</p>
          <p className="type-h3 text-ink">No orders yet</p>
          <p className="type-caption text-ink-muted">When you place an order with {account.email}, you can follow it here.</p>
          <Button href="/new-arrivals" variant="text">
            Shop new arrivals
          </Button>
        </div>
      )}
      <div className={`grid w-full grid-cols-1 gap-4 desk:gap-6 ${upcoming.length ? "desk:grid-cols-2" : "desk:grid-cols-3"}`}>
        <SmallCard
          eyebrow="DEFAULT ADDRESS"
          action={
            <Button variant="text" onClick={() => goTo("addresses")}>
              {defaultAddress ? "Manage addresses" : "Add an address"}
            </Button>
          }
        >
          {defaultAddress ? (
            <>
              <p>
                {defaultAddress.firstName} {defaultAddress.lastName}
              </p>
              <p>{defaultAddress.address1}</p>
              <p>{formatCityLine(defaultAddress)}</p>
              {defaultAddress.country !== HOME_COUNTRY && <p>{countryName(defaultAddress.country)}</p>}
            </>
          ) : (
            <p className="text-ink-muted">No saved address yet.</p>
          )}
        </SmallCard>
        <SmallCard
          eyebrow="WISHLIST"
          action={
            <Button href="/wishlist" variant="text">
              View wishlist
            </Button>
          }
        >
          {saved.length === 0 ? (
            <p className="text-ink-muted">Nothing saved yet — tap the heart on any piece.</p>
          ) : (
            <p>
              {saved.length} piece{saved.length === 1 ? "" : "s"} saved — {saved.slice(0, 2).join(", ")}
              {saved.length > 2 ? ` and ${word(saved.length - 2).toLowerCase()} more` : ""}.
            </p>
          )}
        </SmallCard>
        <SmallCard
          eyebrow="DETAILS"
          action={
            <Button variant="text" onClick={() => goTo("details")}>
              Edit details
            </Button>
          }
        >
          <p className="break-all">{account.email}</p>
          <p>Early access · {account.emailOptIn ? "On" : "Off"}</p>
        </SmallCard>
        {upcoming[0] && (
          // Boutique appointments booked on The House (coach.appointments.v1) — only shown when one is coming up.
          <SmallCard
            eyebrow="APPOINTMENT"
            action={
              <Button href="/the-house#stores" variant="text">
                View boutiques
              </Button>
            }
          >
            <p>
              {SERVICE_LABELS[upcoming[0].service]} · {getStoreById(upcoming[0].storeId)?.shortName}
            </p>
            <p>
              {new Date(`${upcoming[0].date}T00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at {formatMinutes(upcoming[0].minutes)}
            </p>
            {upcoming.length > 1 && <p className="text-ink-muted">and {upcoming.length - 1} more booked</p>}
          </SmallCard>
        )}
      </div>
    </>
  );
}

function Orders({ orders }: { orders: Order[] }) {
  return (
    <>
      <div className="flex flex-col items-start gap-2">
        <p className="type-eyebrow text-accent-deep">MY COACH</p>
        <h1 className="type-h1-mobile text-ink desk:type-h1">Orders</h1>
      </div>
      {orders.length === 0 ? (
        <div className={`${panel} flex w-full flex-col items-start gap-3 p-6 desk:p-8`}>
          <p className="type-h3 text-ink">No orders yet</p>
          <p className="type-caption text-ink-muted">Orders you place while signed in with this email appear here.</p>
          <Button href="/new-arrivals" variant="text">
            Shop new arrivals
          </Button>
        </div>
      ) : (
        <ul className="flex w-full flex-col gap-4">
          {orders.map((order) => {
            const status = getOrderStatusSummary(order);
            const placed = new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            return (
              <li key={order.id}>
                <Link
                  href={`/order/${order.id}`}
                  className={`${panel} group flex w-full flex-col gap-4 p-6 transition-colors hover:bg-blob desk:flex-row desk:items-center desk:gap-6 desk:p-8`}
                >
                  <span className="flex gap-2">
                    {[...new Set(order.lines.map((l) => l.productId))].slice(0, 3).map((id) => (
                      <OrderThumb key={id} productId={id} size={64} />
                    ))}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="type-badge text-accent-deep">Nº {order.id}</span>
                    <span className="type-h4 text-ink">{orderTitle(order)}</span>
                    <span className="type-caption text-ink-muted">Placed {placed}</span>
                  </span>
                  <span className="flex items-center justify-between gap-6 desk:flex-col desk:items-end desk:gap-2">
                    <span className={`type-badge rounded-pill px-3 py-1.5 ${order.status === "cancelled" ? "bg-bg text-ink-muted" : "bg-blob text-accent-deep"}`}>
                      {status.label.toUpperCase()}
                    </span>
                    <span className="type-price-sm text-ink">{formatPrice(order.total)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function Details({ account }: { account: Account }) {
  const { updateProfile } = useSession();
  const [firstName, setFirstName] = useState(account.firstName);
  const [lastName, setLastName] = useState(account.lastName);
  const [optIn, setOptIn] = useState(account.emailOptIn);
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next = { firstName: firstName.trim() ? undefined : "Please enter your first name.", lastName: lastName.trim() ? undefined : "Please enter your last name." };
    setErrors(next);
    if (next.firstName || next.lastName) return;
    updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), emailOptIn: optIn });
    setSaved(true);
  }

  return (
    <>
      <div className="flex flex-col items-start gap-2">
        <p className="type-eyebrow text-accent-deep">MY COACH</p>
        <h1 className="type-h1-mobile text-ink desk:type-h1">Account Details</h1>
      </div>
      <form onSubmit={handleSubmit} noValidate className={`${panel} flex w-full flex-col items-start gap-5 p-6 desk:p-8`} onChange={() => setSaved(false)}>
        <div className="flex w-full flex-col gap-5 desk:flex-row">
          <FormField id="details-firstName" label="First name" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} error={errors.firstName} />
          <FormField id="details-lastName" label="Last name" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} error={errors.lastName} />
        </div>
        <FormField id="details-email" label="Email" type="email" value={account.email} readOnly disabled />
        <div className="flex items-center gap-3">
          <Checkbox
            checked={optIn}
            onChange={(v) => {
              setOptIn(v);
              setSaved(false);
            }}
            label="Early access to new chapters and private events"
          />
          <span aria-hidden="true" className="type-caption text-ink">
            Early access to new chapters and private events
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button type="submit" showArrow={false}>
            Save details
          </Button>
          {saved && (
            <p role="status" className="type-caption text-accent-deep">
              Saved.
            </p>
          )}
        </div>
      </form>
    </>
  );
}

/** Figma "State / Signed In — Account Overview" (94:176): side nav + the selected section. */
export function AccountDashboard({ tab, onTabChange, onSignOut }: { tab: AccountTab; onTabChange: (tab: AccountTab) => void; onSignOut: () => void }) {
  const { account } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    if (account) setOrders(getOrdersByEmail(account.email));
  }, [account]);
  const navItem = (active: boolean) =>
    `type-nav shrink-0 whitespace-nowrap rounded-pill px-4 py-3 text-left transition-colors desk:w-full ${active ? "bg-blob text-accent-deep" : "text-ink hover:text-accent-deep"}`;
  const content = useMemo(() => {
    if (!account) return null;
    if (tab === "orders") return <Orders orders={orders} />;
    if (tab === "addresses") return <AddressBook />;
    if (tab === "details") return <Details account={account} />;
    return <Overview account={account} orders={orders} goTo={onTabChange} />;
  }, [account, orders, tab, onTabChange]);

  // Mobile: the nav is a horizontal scroller — keep the current section in view.
  useEffect(() => {
    document.querySelector<HTMLElement>('nav[aria-label="Account"] [aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [tab]);

  if (!account) return null;
  return (
    <div className="flex flex-col items-start gap-6 pb-16 pt-6 desk:flex-row desk:gap-8 desk:pb-32 desk:pt-12">
      <nav aria-label="Account" className={`${panel} no-scrollbar flex w-full gap-1 overflow-x-auto p-2 desk:w-[280px] desk:shrink-0 desk:flex-col desk:p-6`}>
        {ACCOUNT_TABS.map((t) => (
          <button key={t.key} type="button" aria-current={tab === t.key ? "page" : undefined} onClick={() => onTabChange(t.key)} className={navItem(tab === t.key)}>
            {t.label}
          </button>
        ))}
        <Link href="/wishlist" className={navItem(false)}>
          Wishlist
        </Link>
        <button type="button" onClick={onSignOut} className={`${navItem(false)} !text-ink-muted hover:!text-ink`}>
          Sign out
        </button>
      </nav>
      <div className="flex w-full min-w-0 flex-1 flex-col items-start gap-6">{content}</div>
    </div>
  );
}
