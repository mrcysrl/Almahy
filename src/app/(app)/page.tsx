import { db } from "@/lib/db";
import {
  getDashboardData,
  getDefaultRange,
  resolveRange,
} from "@/lib/dashboard";
import { formatCents } from "@/lib/format";
import { requireUser } from "@/lib/auth/require-user";
import { DashboardDateRange } from "@/components/dashboard/date-range-filter";
import { SalesChart } from "@/components/dashboard/sales-chart";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireUser();

  const params = await searchParams;

  const flat = Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );

  const range = resolveRange(flat.from, flat.to, getDefaultRange(db.orders));
  const data = getDashboardData(db.orders, range);

  const kpis = [
    { label: "Revenue", value: formatCents(data.kpis.revenueCents) },
    { label: "Paid orders", value: String(data.kpis.orderCount) },
    {
      label: "Avg order value",
      value: formatCents(data.kpis.avgOrderValueCents),
    },
    { label: "Pending", value: String(data.kpis.pendingCount) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sales analytics from {range.from} to {range.to}.
          </p>
        </div>
        <DashboardDateRange />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {kpi.label}
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight">
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {data.kpis.orderCount === 0 ? (
        <div className="card border-dashed p-8 text-center">
          <p className="font-medium text-gray-900">No paid orders in this range</p>
          <p className="mt-1 text-sm text-gray-500">
            Try widening the dates. Pending and cancelled orders are not counted as revenue.
          </p>
        </div>
      ) : (
        <SalesChart data={data.daily} />
      )}
    </div>
  );
}