import type { OrderQuery } from "./query";

export function buildOrdersHref(query: OrderQuery, overrides: Partial<OrderQuery>): string {
  const next = { ...query, ...overrides };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return `/orders?${params.toString()}`;
}