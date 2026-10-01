"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Order, OrderStatus } from "@/types";
import { ORDER_STATUSES, type OrderQuery } from "@/lib/orders/query";
import { buildOrdersHref } from "@/lib/orders/url";
import { formatCents, formatDate } from "@/lib/format";
import { STATUS_BADGE } from "@/lib/status-colors";
import { ConfirmDialog } from "@/components/confirm-dialog";

type SortKey = OrderQuery["sort"];
type BulkAction =
  | { kind: "delete" }
  | { kind: "set_status"; status: OrderStatus };

function SortableTh({
  label,
  column,
  query,
}: {
  label: string;
  column: SortKey;
  query: OrderQuery;
}) {
  const active = query.sort === column;
  const nextOrder = active && query.order === "asc" ? "desc" : "asc";

  return (
    <th
      scope="col"
      aria-sort={
        active
          ? query.order === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
    >
      <Link
        href={buildOrdersHref(query, {
          sort: column,
          order: nextOrder,
          page: 1,
        })}
        className="hover:text-gray-900"
      >
        {label}
        {active ? (query.order === "asc" ? " ▲" : " ▼") : ""}
      </Link>
    </th>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`badge ${STATUS_BADGE[status]} capitalize`}>
      {status}
    </span>
  );
}

type Props = {
  orders: Order[];
  query: OrderQuery;
  canManage: boolean;
};

export function OrdersTable({ orders, query, canManage }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [statusChoice, setStatusChoice] = useState<OrderStatus | "">("");
  const [action, setAction] = useState<BulkAction | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const allSelected = orders.length > 0 && selected.size === orders.length;
  const someSelected = selected.size > 0;

  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected && !allSelected;
    }
  }, [someSelected, allSelected]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(orders.map((o) => o.id)));
  }

  function closeDialog() {
    if (pending) return;

    setAction(null);
    setError(null);
  }

  async function runAction() {
    if (!action) return;

    setPending(true);
    setError(null);

    const ids = [...selected];

    const body =
      action.kind === "delete"
        ? { action: "delete", ids }
        : {
            action: "set_status",
            ids,
            status: action.status,
          };

    try {
      const res = await fetch("/api/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;

        setError(data?.error ?? "Request failed. Please try again.");
        return;
      }

      const data = (await res.json()) as {
        affected: number;
        missing: string[];
      };

      setNotice(
        `${data.affected} order(s) updated` +
          (data.missing.length > 0
            ? `, ${data.missing.length} skipped (not allowed).`
            : "."),
      );

      setSelected(new Set());
      setStatusChoice("");
      setAction(null);

      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (orders.length === 0) {
    return (
      <div className="card border-dashed p-8 text-center">
        <p className="font-medium text-gray-900">No orders match your filters</p>

        <Link
          href="/orders"
          className="mt-2 inline-block text-sm text-blue-600 hover:underline"
        >
          Clear filters
        </Link>
      </div>
    );
  }

  const dialogCopy =
    action?.kind === "delete"
      ? {
          title: `Delete ${selected.size} order(s)?`,
          description:
            "This permanently removes the selected orders and their history.",
          confirmLabel: "Delete",
        }
      : {
          title: `Update ${selected.size} order(s)?`,
          description: `Set status to "${
            action?.kind === "set_status" ? action.status : ""
          }" for all selected orders.`,
          confirmLabel: "Update status",
        };

  return (
    <div className="space-y-3">
      {/* Always rendered so screen readers announce text changes inside it */}
      <p
        role="status"
        className={
          notice
            ? "rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
            : "sr-only"
        }
      >
        {notice}
      </p>

      {canManage && someSelected && (
        <div className="card flex flex-wrap items-center gap-3 p-3 text-sm">
          <span className="font-medium">{selected.size} selected</span>

          <label htmlFor="bulk-status" className="sr-only">
            New status
          </label>

          <select
            id="bulk-status"
            value={statusChoice}
            onChange={(e) =>
              setStatusChoice(e.target.value as OrderStatus | "")
            }
            className="input w-auto capitalize"
          >
            <option value="">Set status...</option>

            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={!statusChoice}
            onClick={() => {
              setNotice(null);

              if (statusChoice) {
                setAction({
                  kind: "set_status",
                  status: statusChoice,
                });
              }
            }}
            className="btn btn-secondary"
          >
            Apply
          </button>

          <button
            type="button"
            onClick={() => {
              setNotice(null);
              setAction({ kind: "delete" });
            }}
            className="btn btn-danger"
          >
            Delete
          </button>
        </div>
      )}

      {/* Desktop: table */}
      <div className="card hidden overflow-hidden md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">Orders</caption>

          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              {canManage && (
                <th scope="col" className="w-10 px-4 py-3">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all orders on this page"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}

              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                Order
              </th>

              <SortableTh label="Customer" column="customerName" query={query} />

              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                Status
              </th>

              <SortableTh label="Total" column="totalCents" query={query} />

              <SortableTh label="Created" column="createdAt" query={query} />
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {orders.map((o) => (
              <tr
                key={o.id}
                className={selected.has(o.id) ? "bg-blue-50" : "hover:bg-gray-50"}
              >
                {canManage && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(o.id)}
                      onChange={() => toggle(o.id)}
                      aria-label={`Select order ${o.id}`}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                )}

                <td className="px-4 py-3">
                  <Link
                    href={`/orders/${o.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {o.id}
                  </Link>
                </td>

                <td className="px-4 py-3 text-gray-900">{o.customerName}</td>

                <td className="px-4 py-3">
                  <StatusBadge status={o.status} />
                </td>

                <td className="px-4 py-3 font-medium">
                  {formatCents(o.totalCents)}
                </td>

                <td className="px-4 py-3 text-gray-500">
                  {formatDate(o.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: card list */}
      <ul className="card divide-y divide-gray-100 md:hidden">
        {orders.map((o) => {
          const isSelected = selected.has(o.id);

          return (
            <li key={o.id} className={isSelected ? "bg-blue-50" : ""}>
              <div className="flex items-start gap-3 p-4">
                {canManage && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(o.id)}
                    aria-label={`Select order ${o.id}`}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                )}

                <Link href={`/orders/${o.id}`} className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-gray-900">
                        {o.customerName}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">{o.id}</div>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {formatDate(o.createdAt)}
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatCents(o.totalCents)}
                    </span>
                  </div>
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={action !== null}
        {...dialogCopy}
        pending={pending}
        error={error}
        onConfirm={runAction}
        onCancel={closeDialog}
      />
    </div>
  );
}