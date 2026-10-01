"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { isCommittableDate } from "@/lib/date-input";

const field =
  "rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export function DashboardDateRange() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const urlFrom = searchParams.get("from") ?? "";
  const urlTo = searchParams.get("to") ?? "";

  const [from, setFrom] = useState(urlFrom);
  const [to, setTo] = useState(urlTo);
  const [prev, setPrev] = useState({ from: urlFrom, to: urlTo });

  // Keep inputs in sync when the URL changes from outside (Back, Clear)
  if (prev.from !== urlFrom || prev.to !== urlTo) {
    setPrev({ from: urlFrom, to: urlTo });
    setFrom(urlFrom);
    setTo(urlTo);
  }

  function update(next: { from?: string; to?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function onDateChange(key: "from" | "to", value: string) {
    if (key === "from") setFrom(value);
    else setTo(value);
    if (isCommittableDate(value)) update({ [key]: value });
  }

  return (
    <div
      role="group"
      aria-label="Date range"
      aria-busy={isPending}
      className={`flex flex-wrap items-end gap-3 ${isPending ? "opacity-70" : ""}`}
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-gray-600">From</span>
        <input
          type="date"
          className={field}
          value={from}
          max={to || undefined}
          onChange={(e) => onDateChange("from", e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-gray-600">To</span>
        <input
          type="date"
          className={field}
          value={to}
          min={from || undefined}
          onChange={(e) => onDateChange("to", e.target.value)}
        />
      </label>

      <button
        type="button"
        disabled={!urlFrom && !urlTo}
        className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        onClick={() => {
          setFrom("");
          setTo("");
          update({ from: "", to: "" });
        }}
      >
        Clear
      </button>
    </div>
  );
}