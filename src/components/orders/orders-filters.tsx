"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ORDER_STATUSES } from "@/lib/orders/query";

const MIN_YEAR = 1900;
function isCommittable(value: string): boolean {
  return value === "" || Number(value.slice(0, 4)) >= MIN_YEAR;
}

export function OrdersFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const urlQ = searchParams.get("q") ?? "";
  const urlFrom = searchParams.get("from") ?? "";
  const urlTo = searchParams.get("to") ?? "";
  const status = searchParams.get("status") ?? "";

  const [search, setSearch] = useState(urlQ);
  const [from, setFrom] = useState(urlFrom);
  const [to, setTo] = useState(urlTo);

  const [prev, setPrev] = useState({ q: urlQ, from: urlFrom, to: urlTo });
  if (prev.q !== urlQ || prev.from !== urlFrom || prev.to !== urlTo) {
    setPrev({ q: urlQ, from: urlFrom, to: urlTo });
    setSearch(urlQ);
    setFrom(urlFrom);
    setTo(urlTo);
  }

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function update(
    changes: Record<string, string>,
    mode: "push" | "replace" = "push"
  ) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    const qs = params.toString();
    startTransition(() => {
      router[mode](qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function onSearchChange(value: string) {
    setSearch(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => update({ q: value.trim() }, "replace"), 300);
  }

  function onDateChange(key: "from" | "to", value: string) {
    if (key === "from") setFrom(value);
    else setTo(value);
    if (isCommittable(value)) update({ [key]: value });
  }

  const hasFilters = Boolean(urlQ || status || urlFrom || urlTo);

  return (
    <div
      role="search"
      aria-label="Filter orders"
      aria-busy={isPending}
      className={`card mb-4 p-3 sm:p-4 ${isPending ? "opacity-70" : ""}`}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="filter-q" className="label">
            Search
          </label>
          <input
            id="filter-q"
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Order ID, name or email"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="filter-status" className="label">
            Status
          </label>
          <select
            id="filter-status"
            value={status}
            onChange={(e) => update({ status: e.target.value })}
            className="input capitalize"
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-from" className="label">
            From
          </label>
          <input
            id="filter-from"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => onDateChange("from", e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="filter-to" className="label">
            To
          </label>
          <input
            id="filter-to"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => onDateChange("to", e.target.value)}
            className="input"
          />
        </div>
      </div>

      {hasFilters && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <Link href="/orders" className="btn btn-ghost">
            Clear filters
          </Link>
        </div>
      )}
    </div>
  );
}