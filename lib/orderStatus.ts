import { getTransitDays } from "@/lib/checkout/delivery";
import type { Order } from "@/lib/orders";

export type OrderStage = "preparing" | "shipped" | "delivered";

const DAY_MS = 24 * 60 * 60 * 1000;
export const MANAGE_WINDOW_MS = 60 * 60 * 1000;

/** Demo-friendly ageing: Preparing under a day old, Shipped under three days, Delivered after. */
export function getOrderStage(order: Order, overrideStage?: OrderStage | null): OrderStage {
  if (overrideStage) return overrideStage;
  const ageMs = Date.now() - new Date(order.createdAt).getTime();
  if (ageMs < DAY_MS) return "preparing";
  if (ageMs < 3 * DAY_MS) return "shipped";
  return "delivered";
}

export function isWithinManageWindow(order: Order): boolean {
  if (order.status === "cancelled") return false;
  return Date.now() - new Date(order.createdAt).getTime() < MANAGE_WINDOW_MS;
}

export function manageWindowDeadline(order: Order): Date {
  return new Date(new Date(order.createdAt).getTime() + MANAGE_WINDOW_MS);
}

export function formatDeadlineTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();
}

/** mm:ss remaining until the deadline, floored at 0. */
export function formatCountdown(deadline: Date): string {
  const remainingMs = Math.max(0, deadline.getTime() - Date.now());
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatWeekdayShort(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function formatMonthDay(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export type TimelineStepDates = {
  placedLabel: string;
  preparingLabel: string;
  shippedLabel: string;
  deliveredLabel: string;
};

/** Figma's timeline chips show terse "Oct 5" style dates, offset from the order's placed date. */
export function getTimelineDates(order: Order): TimelineStepDates {
  const placed = new Date(order.createdAt);
  const preparing = addDays(placed, 1);
  const shipped = addDays(placed, 2);
  // One day in the atelier, then the standard transit window — 2–4 days domestic, 5–8 international.
  const [from, to] = getTransitDays(order.shippingAddress?.country ?? "").standard;
  const deliveredStart = addDays(placed, 1 + from);
  const deliveredEnd = addDays(placed, 1 + to);
  const sameMonth = deliveredStart.getMonth() === deliveredEnd.getMonth();
  const deliveredLabel = sameMonth
    ? `${formatMonthDay(deliveredStart)} – ${deliveredEnd.getDate()}`
    : `${formatMonthDay(deliveredStart)} – ${formatMonthDay(deliveredEnd)}`;

  return {
    placedLabel: formatWeekdayShort(placed),
    preparingLabel: formatMonthDay(preparing),
    shippedLabel: formatMonthDay(shipped),
    deliveredLabel,
  };
}

/** The concrete delivered-on date once the order has reached that stage (start of the estimated window). */
export function getDeliveredDate(order: Order): Date {
  return addDays(new Date(order.createdAt), 1 + getTransitDays(order.shippingAddress?.country ?? "").standard[0]);
}

/** A stable, deterministic faux tracking number derived from the order id — no real carrier integration. */
export function getTrackingNumber(order: Order): string {
  const digits = order.id
    .split("")
    .map((c) => c.charCodeAt(0))
    .join("")
    .slice(0, 12)
    .padEnd(12, "0");
  return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
}

/** "Preparing" / "Shipped" / "Delivered" / "Cancelled" plus the delivery estimate — Account order rows + latest-order card. */
export function getOrderStatusSummary(order: Order): { label: string; detail: string; onItsWay: boolean } {
  if (order.status === "cancelled") return { label: "Cancelled", detail: "Cancelled — refund on its way", onItsWay: false };
  const stage = getOrderStage(order);
  const label = stage === "preparing" ? "Preparing" : stage === "shipped" ? "Shipped" : "Delivered";
  const initials = order.lines.some((l) => l.initials) ? " — initials hot-stamped" : "";
  const { deliveredLabel } = getTimelineDates(order);
  const detail = stage === "delivered" ? `Delivered ${formatMonthDay(getDeliveredDate(order))}` : `${label}${initials} · Estimated ${deliveredLabel}`;
  return { label, detail, onItsWay: stage !== "delivered" };
}
