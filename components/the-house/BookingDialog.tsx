"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ErrorSummary } from "@/components/checkout/ErrorSummary";
import { FormField } from "@/components/checkout/FormField";
import { Button } from "@/components/ui/Button";
import { CloseIcon } from "@/components/ui/Icons";
import { Overlay } from "@/components/ui/Overlay";
import { SelectField } from "@/components/ui/SelectField";
import { COUNTRY_LIST, DEFAULT_COUNTRY, getCountry, isValidPhone } from "@/lib/address/countries";
import { SERVICE_LABELS, isoDate, saveAppointment, type Appointment } from "@/lib/appointments";
import { useSession } from "@/lib/auth/SessionContext";
import { appointmentSlots, formatMinutes, isSlotTaken, type AppointmentService, type Store } from "@/lib/stores";

type Field = "service" | "date" | "time" | "name" | "email" | "phone";
const LABELS: Record<Field, string> = { service: "Reason", date: "Day", time: "Time", name: "Name", email: "Email", phone: "Phone" };
const ORDER: Field[] = ["service", "date", "time", "name", "email", "phone"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const chip = (active: boolean, disabled = false) =>
  `type-chip flex h-[42px] items-center rounded-pill px-6 transition-colors ${
    disabled ? "cursor-not-allowed bg-bg text-ink-muted/60 line-through" : active ? "bg-ink text-surface" : "bg-bg text-ink hover:bg-blob"
  }`;

const dayLabel = (d: Date) => `${d.toLocaleDateString("en-US", { weekday: "short" })} ${d.getDate()}`;

/** Figma "Store — Book Appointment" (100:212): reason, day and time chips, then contact details. */
export function BookingDialog({ store, onClose }: { store: Store | null; onClose: () => void }) {
  return (
    <Overlay open={!!store} onClose={onClose} shape="center" label={store ? `Book an appointment at ${store.shortName}` : "Book an appointment"}>
      {store && <BookingForm key={store.id} store={store} onClose={onClose} />}
    </Overlay>
  );
}

function BookingForm({ store, onClose }: { store: Store; onClose: () => void }) {
  const { account } = useSession();
  const [now] = useState(() => new Date());
  const [service, setService] = useState<AppointmentService | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_COUNTRY);
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [summary, setSummary] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Appointment | null>(null);
  const lock = useRef(false);

  // Signed in: name, email and the default address's country come from the account.
  useEffect(() => {
    if (!account) return;
    setName((n) => n || `${account.firstName} ${account.lastName}`.trim());
    setEmail((e) => e || account.email);
    const country = account.addresses.find((a) => a.id === account.defaultAddressId)?.country;
    if (country) setPhoneCountry(country);
  }, [account]);

  // Future days only (today counts while slots remain); a store's closed days stay visible but disabled.
  const days = useMemo(() => {
    const list: { date: Date; iso: string; closed: boolean; slots: number[] }[] = [];
    for (let i = 0; i < store.appointments.daysAhead; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const slots = appointmentSlots(store, d, now);
      if (i === 0 && slots.length === 0 && store.hours[d.getDay()]) continue; // today, but too late to book
      list.push({ date: d, iso: isoDate(d), closed: !store.hours[d.getDay()], slots });
    }
    return list;
  }, [store, now]);
  const day = days.find((d) => d.iso === date) ?? null;

  const errors: Partial<Record<Field, string>> = {};
  if (!service) errors.service = "Choose a reason for your visit.";
  if (!day) errors.date = "Choose a day.";
  if (day && time === null) errors.time = "Choose a time.";
  if (!name.trim()) errors.name = "Please enter your name.";
  if (!email.trim()) errors.email = "Please enter your email address.";
  else if (!EMAIL_RE.test(email.trim())) errors.email = "Enter a valid email address.";
  if (!phone.trim()) errors.phone = "Please enter a phone number — we text a reminder.";
  else if (!isValidPhone(phone, phoneCountry)) errors.phone = `Enter a valid ${getCountry(phoneCountry).name} number, like ${getCountry(phoneCountry).phone.placeholder}.`;
  const visible = Object.fromEntries(ORDER.filter((f) => touched[f] && errors[f]).map((f) => [f, errors[f]])) as Partial<Record<Field, string>>;
  const touch = (f: Field) => setTouched((t) => ({ ...t, [f]: true }));
  const focus = (f: Field) => document.getElementById(`booking-${f}`)?.focus();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    setTouched(Object.fromEntries(ORDER.map((f) => [f, true])));
    const first = ORDER.find((f) => errors[f]);
    if (first) {
      setSummary(true);
      focus(first);
      return;
    }
    lock.current = true;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 900));
    setDone(saveAppointment({ storeId: store.id, service: service!, date: day!.iso, minutes: time!, name: name.trim(), email: email.trim(), phone: phone.trim(), phoneCountry, notes: notes.trim() }));
    setBusy(false);
    lock.current = false;
  }

  const confirmLabel = day && time !== null ? `Confirm ${dayLabel(day.date)} · ${formatMinutes(time, false)}` : "Confirm appointment";

  return (
    <div className="flex max-h-[90vh] w-[min(600px,95vw)] flex-col overflow-y-auto rounded-pill bg-surface">
      <div className="flex items-start justify-between gap-4 px-6 pt-6 desk:px-10 desk:pt-10">
        <div className="flex flex-col gap-3">
          <p className="type-badge text-accent-deep">{store.shortName.toUpperCase()}</p>
          <h2 className="type-h1-mobile text-ink desk:type-h1">{done ? "You’re Booked" : "Book an Appointment"}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-blob">
          <CloseIcon size={20} />
        </button>
      </div>

      {done ? (
        <div role="status" className="flex flex-col items-start gap-3 px-6 pb-8 pt-4 desk:px-10 desk:pb-10">
          <p className="type-body text-ink">
            {SERVICE_LABELS[done.service]} at {store.shortName}, {new Date(`${done.date}T00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at{" "}
            {formatMinutes(done.minutes)}.
          </p>
          <p className="type-body text-ink-muted">
            We’ll confirm by email to {done.email} and by text to {done.phone}.
          </p>
          <p className="type-caption text-ink-muted">
            Reference: <span className="type-price-sm text-ink">{done.reference}</span>
          </p>
          <Button showArrow={false} onClick={onClose} className="mt-2">
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col items-start gap-5 px-6 pb-8 pt-5 desk:px-10 desk:pb-10">
          {summary && Object.keys(visible).length > 0 && <ErrorSummary errors={visible} label={(f) => LABELS[f]} onJumpToField={focus} />}

          <fieldset className="flex w-full flex-col gap-3">
            <legend className="type-h4 pb-3 text-ink">Reason</legend>
            <div id="booking-service" tabIndex={-1} role="radiogroup" aria-label="Reason" className="flex flex-wrap gap-2 focus:outline-none">
              {store.services.map((s) => (
                <button key={s} type="button" role="radio" aria-checked={service === s} onClick={() => (setService(s), touch("service"))} className={chip(service === s)}>
                  {SERVICE_LABELS[s]}
                </button>
              ))}
            </div>
            {visible.service && <p className="type-caption text-error">{visible.service}</p>}
          </fieldset>

          <fieldset className="flex w-full flex-col gap-3">
            <legend className="type-h4 pb-3 text-ink">Day</legend>
            <div id="booking-date" tabIndex={-1} role="radiogroup" aria-label="Day" className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 focus:outline-none">
              {days.map((d) => (
                <button
                  key={d.iso}
                  type="button"
                  role="radio"
                  aria-checked={date === d.iso}
                  aria-disabled={d.closed || undefined}
                  aria-label={`${d.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}${d.closed ? " — closed" : ""}`}
                  data-iso={d.iso}
                  onClick={() => {
                    if (d.closed) return;
                    setDate(d.iso);
                    setTime(null);
                    touch("date");
                  }}
                  className={`${chip(date === d.iso, d.closed)} shrink-0`}
                >
                  {dayLabel(d.date)}
                </button>
              ))}
            </div>
            {visible.date && <p className="type-caption text-error">{visible.date}</p>}
          </fieldset>

          {day && (
            <fieldset className="flex w-full flex-col gap-3">
              <legend className="type-h4 pb-3 text-ink">Time</legend>
              <div id="booking-time" tabIndex={-1} role="radiogroup" aria-label="Time" className="flex flex-wrap gap-2 focus:outline-none">
                {day.slots.map((t) => {
                  const taken = isSlotTaken(store, day.date, t);
                  return (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={time === t}
                      aria-disabled={taken || undefined}
                      aria-label={`${formatMinutes(t)}${taken ? " — booked" : ""}`}
                      onClick={() => !taken && (setTime(t), touch("time"))}
                      className={chip(time === t, taken)}
                    >
                      {formatMinutes(t, false)}
                    </button>
                  );
                })}
              </div>
              {visible.time && <p className="type-caption text-error">{visible.time}</p>}
            </fieldset>
          )}

          <FormField id="booking-name" label="Name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => touch("name")} error={visible.name} />
          <FormField id="booking-email" label="Email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => touch("email")} error={visible.email} />
          <div className="grid w-full grid-cols-1 gap-4 min-[480px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <SelectField id="booking-phone-country" label="Phone country" value={phoneCountry} onChange={(e) => setPhoneCountry(e.target.value)}>
              {COUNTRY_LIST.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} (+{c.phone.dial})
                </option>
              ))}
            </SelectField>
            <FormField
              id="booking-phone"
              label="Phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={getCountry(phoneCountry).phone.placeholder}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => touch("phone")}
              error={visible.phone}
            />
          </div>
          <div className="flex w-full flex-col gap-2">
            <label htmlFor="booking-notes" className="type-caption text-ink">
              Notes — optional
            </label>
            <textarea
              id="booking-notes"
              rows={3}
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything we should prepare?"
              className="type-body w-full resize-y rounded-pill border border-line bg-surface px-5 py-3.5 text-ink placeholder:text-ink-muted focus:border-[1.5px] focus:border-accent-deep focus:outline-none"
            />
          </div>
          <Button type="submit" status={busy ? "loading" : "idle"} disabled={busy} aria-busy={busy} className="w-full">
            {busy ? "Booking" : confirmLabel}
          </Button>
        </form>
      )}
    </div>
  );
}
