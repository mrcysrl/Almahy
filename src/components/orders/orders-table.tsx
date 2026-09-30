"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Order, OrderStatus } from "@/types";
import { ORDER_STATUSES, type OrderQuery } from "@/lib/orders/query";
import { buildOrdersHref } from "@/lib/orders/url";
import { formatCents, formatDate } from "@/lib/format";
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
      className="px-3 py-2 text-left"
    >
      <Link
        href={buildOrdersHref(query, {
          sort: column,
          order: nextOrder,
          page: 1,
        })}
      >
        {label}
        {active ? (query.order === "asc" ? " ▲" : " ▼") : ""}
      </Link>
    </th>
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
    setSelected(
      allSelected ? new Set() : new Set(orders.map((o) => o.id)),
    );
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
      <div className="rounded border border-dashed p-8 text-center">
        <p className="font-medium">No orders match your filters</p>

        <Link href="/orders" className="text-sm underline">
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
      <p role="status" className="min-h-5 text-sm text-green-700">
        {notice}
      </p>

      {canManage && someSelected && (
        <div className="flex flex-wrap items-center gap-3 rounded border bg-gray-50 p-3 text-sm">
          <span>{selected.size} selected</span>

          <label htmlFor="bulk-status" className="sr-only">
            New status
          </label>

          <select
            id="bulk-status"
            value={statusChoice}
            onChange={(e) =>
              setStatusChoice(e.target.value as OrderStatus | "")
            }
            className="rounded border border-gray-300 px-2 py-1 capitalize"
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
            className="rounded border px-3 py-1 disabled:opacity-50"
          >
            Apply
          </button>

          <button
            type="button"
            onClick={() => {
              setNotice(null);
              setAction({ kind: "delete" });
            }}
            className="rounded border border-red-300 px-3 py-1 text-red-700"
          >
            Delete
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Orders</caption>

          <thead className="border-b">
            <tr>
              {canManage && (
                <th scope="col" className="w-10 px-3 py-2">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all orders on this page"
                  />
                </th>
              )}

              <th scope="col" className="px-3 py-2 text-left">
                Order
              </th>

              <SortableTh
                label="Customer"
                column="customerName"
                query={query}
              />

              <th scope="col" className="px-3 py-2 text-left">
                Status
              </th>

              <SortableTh
                label="Total"
                column="totalCents"
                query={query}
              />

              <SortableTh
                label="Created"
                column="createdAt"
                query={query}
              />
            </tr>
          </thead>

          <tbody>
            {orders.map((o) => (
              <tr
                key={o.id}
                className={`border-b ${
                  selected.has(o.id) ? "bg-gray-50" : ""
                }`}
              >
                {canManage && (
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(o.id)}
                      onChange={() => toggle(o.id)}
                      aria-label={`Select order ${o.id}`}
                    />
                  </td>
                )}

                <td className="px-3 py-2">
                  <Link href={`/orders/${o.id}`} className="underline">
                    {o.id}
                  </Link>
                </td>

                <td className="px-3 py-2">{o.customerName}</td>

                <td className="px-3 py-2 capitalize">{o.status}</td>

                <td className="px-3 py-2">
                  {formatCents(o.totalCents)}
                </td>

                <td className="px-3 py-2">
                  {formatDate(o.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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