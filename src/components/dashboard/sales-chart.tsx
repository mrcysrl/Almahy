import type { DailyPoint } from "@/lib/dashboard";
import { formatCents } from "@/lib/format";

export function SalesChart({ data }: { data: DailyPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.revenueCents));

  const width = 720;
  const height = 220;
  const padding = { top: 16, right: 16, bottom: 32, left: 48 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const barW = data.length === 0 ? 0 : innerW / data.length;

  return (
    <div className="rounded border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold">Revenue by day</h2>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Revenue by day chart"
        className="w-full"
      >
        <line
          x1={padding.left}
          y1={padding.top + innerH}
          x2={width - padding.right}
          y2={padding.top + innerH}
          stroke="#e5e7eb"
        />

        {data.map((d, i) => {
          const h = (d.revenueCents / max) * innerH;
          const x = padding.left + i * barW;
          const y = padding.top + innerH - h;

          return (
            <g key={d.date}>
              <rect
                x={x + 2}
                y={y}
                width={Math.max(1, barW - 4)}
                height={h}
                fill="#2563eb"
                rx={2}
              />
              <title>
                {`${d.date}: ${formatCents(d.revenueCents)} (${d.orderCount} orders)`}
              </title>
            </g>
          );
        })}

        <text
          x={padding.left}
          y={height - 8}
          className="fill-gray-500 text-[10px]"
        >
          {data[0]?.date}
        </text>

        <text
          x={width - padding.right}
          y={height - 8}
          textAnchor="end"
          className="fill-gray-500 text-[10px]"
        >
          {data[data.length - 1]?.date}
        </text>
      </svg>

      <table className="sr-only">
        <caption>Revenue by day</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Revenue</th>
            <th>Orders</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <td>{d.date}</td>
              <td>{formatCents(d.revenueCents)}</td>
              <td>{d.orderCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}