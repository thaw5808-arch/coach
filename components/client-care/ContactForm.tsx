"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ErrorSummary } from "@/components/checkout/ErrorSummary";
import { FormField } from "@/components/checkout/FormField";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/SelectField";
import { useSession } from "@/lib/auth/SessionContext";
import {
  CONTACT_LABELS,
  CONTACT_TOPICS,
  MESSAGE_MAX,
  saveContact,
  validateContact,
  type ContactField,
  type ContactSubmission,
  type ContactTopic,
  type ContactValues,
} from "@/lib/clientCare";
import { getOrdersByEmail } from "@/lib/orders";
import { CARE_HOURS } from "@/lib/policies";

const EMPTY: ContactValues = { topic: "", orderNumber: "", name: "", email: "", message: "" };
const ORDER = ["topic", "orderNumber", "name", "email", "message"] as const satisfies readonly ContactField[];
const fieldId = (f: ContactField) => `contact-${f}`;

/** Figma "Contact Us — Sent" (98:258). */
function Sent({ sent, onDone, onAnother }: { sent: ContactSubmission; onDone: () => void; onAnother: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);
  const first = sent.name.trim().split(/\s+/)[0];
  return (
    <div ref={ref} tabIndex={-1} role="status" className="flex w-full flex-col items-center gap-3.5 rounded-[24px] bg-surface px-6 py-12 text-center focus:outline-none desk:px-10">
      <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-full bg-accent-deep font-display text-[18px] font-bold text-surface">
        ✓
      </span>
      <p className="type-badge text-accent-deep">MESSAGE RECEIVED</p>
      <h3 className="type-h1-mobile text-ink desk:type-h1">Thank You, {first}</h3>
      <p className="type-body text-ink-muted">
        Mai from Client Care will reply to {sent.email} within the hour{sent.orderNumber ? ` about order ${sent.orderNumber}` : ""}.
      </p>
      <p className="type-caption text-ink-muted">
        Your reference: <span className="type-price-sm text-ink">{sent.reference}</span>
      </p>
      <div className="flex flex-col items-center gap-2 pt-2 desk:flex-row desk:gap-4">
        <Button variant="secondary" showArrow={false} onClick={onDone} className="border border-line">
          Back to Client Care
        </Button>
        <Button variant="text" showArrow={false} onClick={onAnother}>
          Send another message
        </Button>
      </div>
    </div>
  );
}

/** Figma "Contact Us — Form" (98:226): topic first; the order number appears only for order topics. */
export function ContactForm({ initialTopic, onDone }: { initialTopic?: ContactTopic | null; onDone: () => void }) {
  const { account } = useSession();
  const [values, setValues] = useState<ContactValues>({ ...EMPTY, topic: initialTopic ?? "" });
  const [touched, setTouched] = useState<Partial<Record<ContactField, boolean>>>({});
  const [summary, setSummary] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<ContactSubmission | null>(null);
  const submitting = useRef(false);

  // Signed in: name + email come from the account; their orders are offered for the order number.
  useEffect(() => {
    if (!account) return;
    setValues((v) => ({ ...v, name: v.name || `${account.firstName} ${account.lastName}`.trim(), email: v.email || account.email }));
  }, [account]);
  const recentOrders = useMemo(() => (account ? getOrdersByEmail(account.email).slice(0, 5) : []), [account]);

  useEffect(() => {
    if (initialTopic) setValues((v) => ({ ...v, topic: initialTopic }));
  }, [initialTopic]);

  const topic = CONTACT_TOPICS.find((t) => t.key === values.topic);
  const errors = validateContact(values);
  const visible = Object.fromEntries(ORDER.filter((f) => touched[f] && errors[f]).map((f) => [f, errors[f]])) as Partial<Record<ContactField, string>>;
  const set = (patch: Partial<ContactValues>) => setValues((v) => ({ ...v, ...patch }));
  const blur = (f: ContactField) => setTouched((t) => ({ ...t, [f]: true }));
  const focusField = (f: ContactField) => document.getElementById(fieldId(f))?.focus();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting.current) return; // double-submit lock
    setTouched(Object.fromEntries(ORDER.map((f) => [f, true])));
    const first = ORDER.find((f) => errors[f]);
    if (first) {
      setSummary(true);
      focusField(first);
      return;
    }
    submitting.current = true;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 900)); // simulated send
    setSent(saveContact({ ...values, orderNumber: topic?.needsOrder ? values.orderNumber : "" }));
    setBusy(false);
    submitting.current = false;
  }

  if (sent) {
    return (
      <Sent
        sent={sent}
        onDone={onDone}
        onAnother={() => {
          setSent(null);
          setValues((v) => ({ ...EMPTY, name: v.name, email: v.email }));
          setTouched({});
          setSummary(false);
        }}
      />
    );
  }

  const summaryErrors = summary ? visible : {};
  return (
    <form onSubmit={handleSubmit} noValidate aria-labelledby="contact-title" className="flex w-full flex-col items-start gap-5 rounded-[24px] bg-surface p-6 desk:p-10">
      <h3 id="contact-title" className="type-h1-mobile text-ink desk:type-h1">
        Write to Us
      </h3>
      {Object.keys(summaryErrors).length > 0 && <ErrorSummary errors={summaryErrors} label={(f) => CONTACT_LABELS[f]} onJumpToField={focusField} />}
      <SelectField
        id={fieldId("topic")}
        label="Topic"
        value={values.topic}
        onChange={(e) => set({ topic: e.target.value as ContactTopic })}
        onBlur={() => blur("topic")}
        error={visible.topic}
      >
        <option value="">Choose a topic</option>
        {CONTACT_TOPICS.map((t) => (
          <option key={t.key} value={t.key}>
            {t.label}
          </option>
        ))}
      </SelectField>
      {topic?.needsOrder && (
        <>
          <FormField
            id={fieldId("orderNumber")}
            label="Order number — optional"
            placeholder="CO-7K2M9Q"
            autoComplete="off"
            autoCapitalize="characters"
            list={recentOrders.length ? "contact-recent-orders" : undefined}
            value={values.orderNumber}
            onChange={(e) => set({ orderNumber: e.target.value })}
            onBlur={() => {
              set({ orderNumber: values.orderNumber.trim().toUpperCase() });
              blur("orderNumber");
            }}
            error={visible.orderNumber}
          />
          {recentOrders.length > 0 && (
            <datalist id="contact-recent-orders">
              {recentOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  {new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </option>
              ))}
            </datalist>
          )}
        </>
      )}
      <FormField id={fieldId("name")} label="Name" autoComplete="name" value={values.name} onChange={(e) => set({ name: e.target.value })} onBlur={() => blur("name")} error={visible.name} />
      <FormField
        id={fieldId("email")}
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={values.email}
        onChange={(e) => set({ email: e.target.value })}
        onBlur={() => blur("email")}
        error={visible.email}
      />
      <div className="flex w-full flex-col items-start gap-2">
        <label htmlFor={fieldId("message")} className="type-caption text-ink">
          Message
        </label>
        <textarea
          id={fieldId("message")}
          rows={4}
          maxLength={MESSAGE_MAX}
          placeholder="Tell us how we can help"
          value={values.message}
          onChange={(e) => set({ message: e.target.value })}
          onBlur={() => blur("message")}
          aria-invalid={!!visible.message || undefined}
          aria-describedby={visible.message ? `${fieldId("message")}-error` : undefined}
          className={`type-body min-h-[120px] w-full resize-y rounded-pill border bg-surface px-5 py-3.5 text-ink placeholder:text-ink-muted focus:outline-none ${
            visible.message ? "border-[1.5px] border-error" : "border-line focus:border-[1.5px] focus:border-accent-deep"
          }`}
        />
        {visible.message && (
          <p id={`${fieldId("message")}-error`} role="alert" className="type-caption text-error">
            {visible.message}
          </p>
        )}
      </div>
      <Button type="submit" status={busy ? "loading" : "idle"} disabled={busy} aria-busy={busy} className="w-full">
        {busy ? "Sending" : "Send message"}
      </Button>
      <p className="type-caption text-ink-muted">We reply within the hour, {CARE_HOURS} daily.</p>
    </form>
  );
}
