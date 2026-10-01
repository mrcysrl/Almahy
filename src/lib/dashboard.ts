import type { Order } from "@/types";

export type DashboardRange = { from: string; to: string };
export type DashboardKpis = {
  revenueCents: number;
  orderCount: number;
  avgOrderValueCents: number;
  pendingCount: number;
};
export type DailyPoint = {
  date: string;
  revenueCents: number;
  orderCount: number;
};
export type DashboardData = {
  range: DashboardRange;
  kpis: DashboardKpis;
  daily: DailyPoint[];
};

const MAX_RANGE_DAYS = 366;

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function addDays(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): string[] {
  const out: string[] = [];
  let cur = from;
  while (cur <= to) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

function isValidDateKey(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00.000Z`);
  // round-trip rejects impossible dates like 2026-02-30
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function getDefaultRange(orders: Order[]): DashboardRange {
  if (orders.length === 0) {
    const to = new Date().toISOString().slice(0, 10);
    return { from: addDays(to, -29), to };
  }

  const max = orders.reduce(
    (a, o) => (o.createdAt > a ? o.createdAt : a),
    orders[0].createdAt,
  );
  const to = toDateKey(max);
  return { from: addDays(to, -29), to };
}

export function resolveRange(
  from: string | undefined,
  to: string | undefined,
  fallback: DashboardRange,
): DashboardRange {
  const f = from && isValidDateKey(from) ? from : fallback.from;
  const t = to && isValidDateKey(to) ? to : fallback.to;
  if (f > t) return fallback;

  const days =
    (Date.parse(`${t}T00:00:00.000Z`) -
      Date.parse(`${f}T00:00:00.000Z`)) /
    86_400_000;
  if (days >= MAX_RANGE_DAYS) return fallback;

  return { from: f, to: t };
}

export function getDashboardData(
  orders: Order[],
  range: DashboardRange,
): DashboardData {
  const { from, to } = range;

  const inRange = orders.filter((o) => {
    const d = toDateKey(o.createdAt);
    return d >= from && d <= to;
  });

  const nonCancelled = inRange.filter((o) => o.status !== "cancelled");
  const revenueOrders = nonCancelled.filter((o) => o.status !== "pending");

  const revenueCents = revenueOrders.reduce((sum, o) => sum + o.totalCents, 0);
  const orderCount = revenueOrders.length;
  const avgOrderValueCents =
    orderCount === 0 ? 0 : Math.round(revenueCents / orderCount);
  const pendingCount = nonCancelled.filter((o) => o.status === "pending").length;

  const byDay = new Map<string, { revenueCents: number; orderCount: number }>();
  for (const day of daysBetween(from, to)) {
    byDay.set(day, { revenueCents: 0, orderCount: 0 });
  }

  for (const o of revenueOrders) {
    const day = toDateKey(o.createdAt);
    const entry = byDay.get(day);
    if (entry) {
      entry.revenueCents += o.totalCents;
      entry.orderCount += 1;
    }
  }

  const daily = Array.from(byDay.entries()).map(([date, v]) => ({
    date,
    ...v,
  }));

  return {
    range,
    kpis: { revenueCents, orderCount, avgOrderValueCents, pendingCount },
    daily,
  };
}