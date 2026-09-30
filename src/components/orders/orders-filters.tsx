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

  // Keep local inputs in sync when the URL changes from outside (Back, "Clear filters")
  const [prev, setPrev] = useState({ q: urlQ, from: urlFrom, to: urlTo });
  if (prev.q !== urlQ || prev.from !== urlFrom || prev.to !== urlTo) {
    setPrev({ q: urlQ, from: urlFrom, to: urlTo });
    setSearch(urlQ);
    setFrom(urlFrom);
    setTo(urlTo);
  }

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function update(changes: Record<string, string>, mode: "push" | "replace" = "push") {
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
  const field = "mt-1 rounded border border-gray-300 px-3 py-2 text-sm";

  return (
    <div
      role="search"
      aria-label="Filter orders"
      aria-busy={isPending}
      className={`flex flex-wrap items-end gap-3 ${isPending ? "opacity-70" : ""}`}
    >
      <div>
        <label htmlFor="filter-q" className="block text-sm font-medium">
          Search
        </label>
        <input
          id="filter-q"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Order ID, name or email"
          className={`${field} w-64`}
        />
      </div>

      <div>
        <label htmlFor="filter-status" className="block text-sm font-medium">
          Status
        </label>
        <select
          id="filter-status"
          value={status}
          onChange={(e) => update({ status: e.target.value })}
          className={`${field} capitalize`}
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
        <label htmlFor="filter-from" className="block text-sm font-medium">
          From
        </label>
        <input
          id="filter-from"
          type="date"
          value={from}
          max={to || undefined}
          onChange={(e) => onDateChange("from", e.target.value)}
          className={field}
        />
      </div>

      <div>
        <label htmlFor="filter-to" className="block text-sm font-medium">
          To
        </label>
        <input
          id="filter-to"
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => onDateChange("to", e.target.value)}
          className={field}
        />
      </div>

      {hasFilters && (
        <Link href="/orders" className="pb-2 text-sm underline">
          Clear filters
        </Link>
      )}
    </div>
  );
}