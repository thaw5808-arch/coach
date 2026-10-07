import type { AppointmentService } from "@/lib/stores";

export const SERVICE_LABELS: Record<AppointmentService, string> = { styling: "Personal styling", repair: "Repair & care", personalisation: "Personalisation" };

export type Appointment = {
  reference: string;
  storeId: string;
  service: AppointmentService;
  /** Local date "2026-10-06" and minutes from midnight. */
  date: string;
  minutes: number;
  name: string;
  email: string;
  phone: string;
  phoneCountry: string;
  notes: string;
  createdAt: string;
};

const KEY = "coach.appointments.v1";

export function readAppointments(): Appointment[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Stored on this device only — no booking system behind this concept site. */
export function saveAppointment(a: Omit<Appointment, "reference" | "createdAt">): Appointment {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const entry: Appointment = { ...a, reference: `AP-${Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")}`, createdAt: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify([...readAppointments(), entry]));
  } catch {
    /* storage blocked — the confirmation still shows */
  }
  return entry;
}

export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
