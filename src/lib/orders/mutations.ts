import { db } from "@/lib/db";
import type { FieldChange, Order, OrderEvent, User } from "@/types";
import type { BulkInput, CreateOrderInput, UpdateOrderInput } from "./schemas";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

type EventPayload = DistributiveOmit<
  OrderEvent,
  "id" | "orderId" | "actorId" | "actorName" | "createdAt"
>;

function logEvent(orderId: string, actor: User, payload: EventPayload): void {
  db.events.push({
    id: `evt_${crypto.randomUUID().slice(0, 8)}`,
    orderId,
    actorId: actor.id,
    actorName: actor.name,
    createdAt: new Date().toISOString(),
    ...payload,
  });
}

export function createOrder(input: CreateOrderInput, actor: User): Order {
  const id = `ord_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const items = input.items.map((it, i) => ({
    id: `${id}_item_${i + 1}`,
    ...it,
  }));

  const order: Order = {
    id,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    shippingAddress: input.shippingAddress,
    notes: input.notes,
    status: "pending",
    items,
    // never trust a client-supplied total
    totalCents: items.reduce(
      (sum, it) => sum + it.quantity * it.unitPriceCents,
      0,
    ),
    createdAt: now,
    updatedAt: now,
  };

  db.orders.unshift(order);
  logEvent(id, actor, { type: "created" });
  return order;
}

const EDITABLE_FIELDS = [
  "customerName",
  "customerEmail",
  "shippingAddress",
  "notes",
] as const;

export function updateOrder(
  id: string,
  input: UpdateOrderInput,
  actor: User,
): Order | null {
  const order = db.orders.find((o) => o.id === id);
  if (!order) return null;

  const changes: FieldChange[] = [];

  for (const field of EDITABLE_FIELDS) {
    const next = input[field];

    if (next !== undefined && next !== order[field]) {
      changes.push({
        field,
        from: String(order[field] ?? ""),
        to: next,
      });

      order[field] = next;
    }
  }

  if (input.status && input.status !== order.status) {
    logEvent(id, actor, {
      type: "status_changed",
      from: order.status,
      to: input.status,
    });

    order.status = input.status;
  }

  if (changes.length > 0) {
    logEvent(id, actor, {
      type: "edited",
      changes,
    });
  }

  order.updatedAt = new Date().toISOString();

  return order;
}

export function deleteOrder(id: string): boolean {
  const index = db.orders.findIndex((o) => o.id === id);

  if (index === -1) return false;

  db.orders.splice(index, 1);
  db.events = db.events.filter((e) => e.orderId !== id);

  return true;
}

export function bulkApply(
  input: BulkInput,
  actor: User,
): { affected: number; missing: string[] } {
  const missing: string[] = [];
  let affected = 0;

  for (const id of input.ids) {
    const ok =
      input.action === "delete"
        ? deleteOrder(id)
        : updateOrder(id, { status: input.status }, actor) !== null;

    if (ok) affected++;
    else missing.push(id);
  }

  return { affected, missing };
}
