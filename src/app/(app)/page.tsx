import { db } from "@/lib/db";
import { getDashboardData, getDefaultRange } from "@/lib/dashboard";
import { formatCents } from "@/lib/format";
import { DashboardDateRange } from "@/components/dashboard/date-range-filter";
import { SalesChart } from "@/components/dashboard/sales-chart";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const flat = Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ])
  );

  const defaultRange = getDefaultRange(db.orders);

  const from =
    typeof flat.from === "string" && flat.from.length === 10
      ? flat.from
      : defaultRange.from;

  const to =
    typeof flat.to === "string" && flat.to.length === 10
      ? flat.to
      : defaultRange.to;

  const range = from <= to ? { from, to } : defaultRange;
  const data = getDashboardData(db.orders, range);

  const kpis = [
    { label: "Revenue", value: formatCents(data.kpis.revenueCents) },
    { label: "Orders", value: String(data.kpis.orderCount) },
    {
      label: "Avg order value",
      value: formatCents(data.kpis.avgOrderValueCents),
    },
    { label: "Pending", value: String(data.kpis.pendingCount) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <DashboardDateRange />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded border border-gray-200 bg-white p-4"
          >
            <div className="text-sm text-gray-500">{kpi.label}</div>
            <div className="mt-1 text-2xl font-semibold">{kpi.value}</div>
          </div>
        ))}
      </div>

      <SalesChart data={data.daily} />
    </div>
  );
}