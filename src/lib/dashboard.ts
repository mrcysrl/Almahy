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

export function getDashboardData(
  orders: Order[],
  range: DashboardRange,
): DashboardData {
  const { from, to } = range;

  const inRange = orders.filter((o) => {
    const d = toDateKey(o.createdAt);
    return d >= from && d <= to;
  });

  const active = inRange.filter((o) => o.status !== "cancelled");

  const revenueCents = active.reduce((sum, o) => sum + o.totalCents, 0);
  const orderCount = active.length;
  const avgOrderValueCents =
    orderCount === 0 ? 0 : Math.round(revenueCents / orderCount);
  const pendingCount = active.filter((o) => o.status === "pending").length;

  const byDay = new Map<string, { revenueCents: number; orderCount: number }>();
  for (const day of daysBetween(from, to)) {
    byDay.set(day, { revenueCents: 0, orderCount: 0 });
  }

  for (const o of active) {
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
