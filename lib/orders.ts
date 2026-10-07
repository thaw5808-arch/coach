import type { BagLine } from "@/lib/bag/BagContext";
import type { DeliveryFormValues } from "@/lib/checkout/validation";
import type { DeliveryMethod } from "@/lib/checkout/delivery";
import { migrateAddress } from "@/lib/address/countries";

export type OrderLineSnapshot = {
  productId: string;
  name: string;
  colour: string;
  quantity: number;
  unitPrice: number;
  initials?: string;
  finish?: string;
};

export type OrderStatus = "placed" | "cancelled";

export type Order = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  lines: OrderLineSnapshot[];
  subtotal: number;
  discount: number;
  deliveryPrice: number;
  tax: number;
  giftCardAmount: number;
  total: number;
  firstName: string;
  lastName: string;
  contactEmail: string;
  contactPhone: string;
  deliveryMethod: DeliveryMethod;
  shippingAddress: DeliveryFormValues | null;
  storeId: string | null;
  payment: { brand: string; last4: string } | { method: "paypal" | "applepay" };
};

const ORDERS_KEY = "coach.orders.v1";

function randomOrderId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `CO-${suffix}`;
}

export function createOrderId(): string {
  return randomOrderId();
}

function readOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    const orders = raw ? (JSON.parse(raw) as Order[]) : [];
    // Orders placed before country/region codes stored full names — map them on read (lib/address/countries.ts).
    return orders.map((o) => (o.shippingAddress ? { ...o, shippingAddress: migrateAddress(o.shippingAddress) } : o));
  } catch {
    return [];
  }
}

function writeOrders(orders: Order[]) {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch {
    /* storage full or blocked — the confirmation page will fall back gracefully */
  }
}

export function saveOrder(order: Order) {
  const orders = readOrders();
  orders.push(order);
  writeOrders(orders);
}

export function getOrder(id: string): Order | null {
  return readOrders().find((o) => o.id === id) ?? null;
}

/** Marks an order cancelled in storage. Returns the updated order, or null if the id wasn't found. */
export function cancelOrder(id: string): Order | null {
  const orders = readOrders();
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) return null;
  const updated: Order = { ...orders[index], status: "cancelled" };
  orders[index] = updated;
  writeOrders(orders);
  return updated;
}

export function snapshotLines(lines: BagLine[], getProduct: (id: string) => { name: string; price: number; colours: { name: string }[] } | undefined): OrderLineSnapshot[] {
  return lines.map((l) => {
    const product = getProduct(l.productId);
    return {
      productId: l.productId,
      name: product?.name ?? "Item",
      colour: l.colour ?? "",
      quantity: l.quantity,
      unitPrice: product?.price ?? 0,
      initials: l.initials,
      finish: l.finish,
    };
  });
}

/** Every order placed with this email on this device, newest first (Account → Orders). */
export function getOrdersByEmail(email: string): Order[] {
  const key = email.trim().toLowerCase();
  return readOrders()
    .filter((o) => o.contactEmail.trim().toLowerCase() === key)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
