import Link from "next/link";
import type { Order } from "@/types";
import type { OrderQuery } from "@/lib/orders/query";
import { buildOrdersHref } from "@/lib/orders/url";
import { formatCents, formatDate } from "@/lib/format";

type SortKey = OrderQuery["sort"];

function SortableTh({ label, column, query }: { label: string; column: SortKey; query: OrderQuery }) {
  const active = query.sort === column;
  const nextOrder = active && query.order === "asc" ? "desc" : "asc";
  return (
    <th
      scope="col"
      aria-sort={active ? (query.order === "asc" ? "ascending" : "descending") : "none"}
      className="px-3 py-2 text-left"
    >
      <Link href={buildOrdersHref(query, { sort: column, order: nextOrder, page: 1 })}>
        {label}
        {active ? (query.order === "asc" ? " ▲" : " ▼") : ""}
      </Link>
    </th>
  );
}

export function OrdersTable({ orders, query }: { orders: Order[]; query: OrderQuery }) {
  if (orders.length === 0) {
    return (
      <div className="rounded border border-dashed p-8 text-center">
        <p className="font-medium">No orders match your filters</p>
        <Link href="/orders" className="text-sm underline">
          Clear filters
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Orders</caption>
        <thead className="border-b">
          <tr>
            <th scope="col" className="px-3 py-2 text-left">Order</th>
            <SortableTh label="Customer" column="customerName" query={query} />
            <th scope="col" className="px-3 py-2 text-left">Status</th>
            <SortableTh label="Total" column="totalCents" query={query} />
            <SortableTh label="Created" column="createdAt" query={query} />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b">
              <td className="px-3 py-2">
                <Link href={`/orders/${o.id}`} className="underline">
                  {o.id}
                </Link>
              </td>
              <td className="px-3 py-2">{o.customerName}</td>
              <td className="px-3 py-2 capitalize">{o.status}</td>
              <td className="px-3 py-2">{formatCents(o.totalCents)}</td>
              <td className="px-3 py-2">{formatDate(o.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}