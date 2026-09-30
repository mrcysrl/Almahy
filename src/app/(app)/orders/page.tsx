import { redirect } from "next/navigation";
import { db } from "@/lib/db";
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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Orders</h1>

      <OrdersFilters />

      <OrdersTable orders={result.data} query={query} />

      <Pagination
        query={query}
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
      />
    </div>
  );
}
