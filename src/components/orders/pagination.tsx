import Link from "next/link";
import type { OrderQuery } from "@/lib/orders/query";
import { buildOrdersHref } from "@/lib/orders/url";

type Props = { query: OrderQuery; page: number; totalPages: number; total: number };

export function Pagination({ query, page, totalPages, total }: Props) {
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
      <p>
        Page {page} of {totalPages} ({total} orders)
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={buildOrdersHref(query, { page: page - 1 })} className="rounded border px-3 py-1">
            Previous
          </Link>
        ) : (
          <span aria-disabled="true" className="rounded border px-3 py-1 opacity-50">Previous</span>
        )}
        {page < totalPages ? (
          <Link href={buildOrdersHref(query, { page: page + 1 })} className="rounded border px-3 py-1">
            Next
          </Link>
        ) : (
          <span aria-disabled="true" className="rounded border px-3 py-1 opacity-50">Next</span>
        )}
      </div>
    </nav>
  );
}