import { z } from "zod";
import type { Order, OrderStatus } from "@/types";

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const satisfies readonly OrderStatus[];

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  q: z.string().trim().max(100).optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  from: dateOnly.optional(),
  to: dateOnly.optional(),
  sort: z
    .enum(["createdAt", "totalCents", "customerName"])
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type OrderQuery = z.infer<typeof orderQuerySchema>;

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function queryOrders(all: Order[], query: OrderQuery): Paginated<Order> {
  const { page, pageSize, q, status, from, to, sort, order } = query;
  const needle = q?.toLowerCase();

  const filtered = all.filter((o) => {
    if (status && o.status !== status) return false;
    if (from && o.createdAt < `${from}T00:00:00.000Z`) return false;
    if (to && o.createdAt > `${to}T23:59:59.999Z`) return false;
    if (
      needle &&
      !`${o.id} ${o.customerName} ${o.customerEmail}`
        .toLowerCase()
        .includes(needle)
    ) {
      return false;
    }
    return true;
  });

  const dir = order === "asc" ? 1 : -1;
  filtered.sort((a, b) => {
    const cmp =
      sort === "totalCents"
        ? a.totalCents - b.totalCents
        : a[sort].localeCompare(b[sort]);
    return cmp !== 0 ? cmp * dir : a.id.localeCompare(b.id);
  });

  const total = filtered.length;
  const start = (page - 1) * pageSize;

  return {
    data: filtered.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
