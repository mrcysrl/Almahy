import type { Order, OrderEvent, OrderItem, OrderStatus, User } from "@/types";

const REF_TIME = Date.parse("2026-09-30T00:00:00.000Z");
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export const users: User[] = [
  { id: "u1", name: "Alice Admin", email: "admin@example.com", role: "admin" },
  {
    id: "u2",
    name: "Sam Support",
    email: "support@example.com",
    role: "support",
  },
];

const FLOW: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
];
const FIRST_NAMES = [
  "Liam",
  "Emma",
  "Noah",
  "Olivia",
  "Ava",
  "Ethan",
  "Mia",
  "Lucas",
];
const LAST_NAMES = [
  "Tan",
  "Lim",
  "Wong",
  "Patel",
  "Singh",
  "Lee",
  "Chen",
  "Ng",
];
const PRODUCTS = [
  "Desk Lamp",
  "Keyboard",
  "Monitor Stand",
  "Notebook",
  "Headphones",
  "Webcam",
];

// mulberry32: small seeded PRNG
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSeed(): { orders: Order[]; events: OrderEvent[] } {
  const rand = mulberry32(42);
  const int = (min: number, max: number) =>
    Math.floor(rand() * (max - min + 1)) + min;
  const pick = <T>(arr: readonly T[]): T =>
    arr[Math.floor(rand() * arr.length)];

  const orders: Order[] = [];
  const events: OrderEvent[] = [];
  const actor = users[0];
  let eventCounter = 0;

  for (let i = 1; i <= 60; i++) {
    const id = `ord_${String(i).padStart(3, "0")}`;
    const createdMs = REF_TIME - int(0, 90 * 24 * 60) * MINUTE;

    const items: OrderItem[] = Array.from({ length: int(1, 3) }, (_, k) => ({
      id: `${id}_item_${k + 1}`,
      productName: pick(PRODUCTS),
      quantity: int(1, 4),
      unitPriceCents: int(500, 20000),
    }));
    const totalCents = items.reduce(
      (sum, it) => sum + it.quantity * it.unitPriceCents,
      0,
    );

    const path: OrderStatus[] =
      rand() < 0.1
        ? ["pending", "cancelled"]
        : FLOW.slice(0, int(1, FLOW.length));

    const customerName = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    let lastMs = createdMs;

    events.push({
      id: `evt_${++eventCounter}`,
      orderId: id,
      actorId: actor.id,
      actorName: actor.name,
      createdAt: new Date(createdMs).toISOString(),
      type: "created",
    });

    for (let s = 1; s < path.length; s++) {
      lastMs = Math.min(lastMs + int(1, 36) * HOUR, REF_TIME);
      events.push({
        id: `evt_${++eventCounter}`,
        orderId: id,
        actorId: actor.id,
        actorName: actor.name,
        createdAt: new Date(lastMs).toISOString(),
        type: "status_changed",
        from: path[s - 1],
        to: path[s],
      });
    }

    orders.push({
      id,
      customerName,
      customerEmail: `${customerName.toLowerCase().replace(" ", ".")}@example.com`,
      status: path[path.length - 1],
      items,
      totalCents,
      shippingAddress: `${int(1, 99)} Example Street, Singapore`,
      createdAt: new Date(createdMs).toISOString(),
      updatedAt: new Date(lastMs).toISOString(),
    });
  }

  return { orders, events };
}
