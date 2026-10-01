import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-user";
import { orderQuerySchema, queryOrders } from "@/lib/orders/query";
import { buildOrdersHref } from "@/lib/orders/url";
import { OrdersTable } from "@/components/orders/orders-table";
import { OrdersFilters } from "@/components/orders/orders-filters";
import { Pagination } from "@/components/orders/pagination";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const flattenedParams = Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );

  const parsed = orderQuerySchema.safeParse(flattenedParams);
  const query = parsed.success ? parsed.data : orderQuerySchema.parse({});

  const result = queryOrders(db.orders, query);

  // Out-of-range page: send the user to the last real page, keeping all other params
  if (result.page > result.totalPages) {
    redirect(buildOrdersHref(query, { page: result.totalPages }));
  }

  const user = await requireUser();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orders</h1>
        {user?.role === "admin" && (
          <Link
            href="/orders/new"
            className="rounded bg-black px-3 py-2 text-sm text-white"
          >
            New order
          </Link>
        )}
      </div>

      <OrdersFilters />

      <OrdersTable
        key={JSON.stringify(query)}
        orders={result.data}
        query={query}
        canManage={user?.role === "admin"}
      />

      <Pagination
        query={query}
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
      />
    </div>
  );
}
