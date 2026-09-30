"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const field =
  "rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export function DashboardDateRange() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlFrom = searchParams.get("from") ?? "";
  const urlTo = searchParams.get("to") ?? "";

  const [from, setFrom] = useState(urlFrom);
  const [to, setTo] = useState(urlTo);
  const [prev, setPrev] = useState({ from: urlFrom, to: urlTo });

  if (prev.from !== urlFrom || prev.to !== urlTo) {
    setPrev({ from: urlFrom, to: urlTo });
    setFrom(urlFrom);
    setTo(urlTo);
  }

  function update(
    next: { from?: string; to?: string },
    mode: "push" | "replace" = "push"
  ) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    router[mode](qs ? `${pathname}?${qs}` : pathname);
  }

  function onDateChange(key: "from" | "to", value: string) {
    if (key === "from") setFrom(value);
    else setTo(value);

    if (value === "" || value.length === 10) {
      update({ [key]: value });
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-gray-600">From</span>
        <input
          type="date"
          className={field}
          value={from}
          onChange={(e) => onDateChange("from", e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-gray-600">To</span>
        <input
          type="date"
          className={field}
          value={to}
          onChange={(e) => onDateChange("to", e.target.value)}
        />
      </label>

      <button
        type="button"
        className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
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