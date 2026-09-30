import Link from "next/link";
import type { OrderQuery } from "@/lib/orders/query";
import { buildOrdersHref } from "@/lib/orders/url";

type Props = {
  query: OrderQuery;
  page: number;
  totalPages: number;
  total: number;
};

export function Pagination({ query, page, totalPages, total }: Props) {
  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex flex-col items-center justify-between gap-3 text-sm sm:flex-row"
    >
      <p className="text-gray-500">
        Page <span className="font-medium text-gray-900">{page}</span> of{" "}
        {totalPages} · {total} orders
      </p>

      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={buildOrdersHref(query, { page: page - 1 })}
            className="btn btn-secondary"
          >
            Previous
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="btn btn-secondary pointer-events-none opacity-50"
          >
            Previous
          </span>
        )}

        {page < totalPages ? (
          <Link
            href={buildOrdersHref(query, { page: page + 1 })}
            className="btn btn-secondary"
          >
            Next
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="btn btn-secondary pointer-events-none opacity-50"
          >
            Next
          </span>
        )}
      </div>
    </nav>
  );
}