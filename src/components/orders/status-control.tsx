"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/types";
import { TRANSITIONS } from "@/lib/orders/transitions";

export function StatusControl({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [prevProp, setPrevProp] = useState(status);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Adopt the server value whenever a refresh delivers a new one
  if (status !== prevProp) {
    setPrevProp(status);
    setCurrent(status);
  }

  const options = [current, ...TRANSITIONS[current]];

  async function change(next: OrderStatus) {
    const previous = current;
    setError(null);
    setCurrent(next); // optimistic
    setPending(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setCurrent(previous); // rollback
        setError(data?.error ?? "Could not update status.");
        return;
      }
      router.refresh(); // pulls the new timeline entry
    } catch {
      setCurrent(previous);
      setError("Network error. Status was not changed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <label htmlFor="order-status" className="block text-sm font-medium">
        Status
      </label>
      {options.length === 1 ? (
        <p className="mt-1 text-sm capitalize">{current} (final)</p>
      ) : (
        <select
          id="order-status"
          value={current}
          disabled={pending}
          onChange={(e) => change(e.target.value as OrderStatus)}
          className="mt-1 rounded border border-gray-300 px-3 py-2 text-sm capitalize"
        >
          {options.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )}
      <p role="alert" className="mt-1 min-h-5 text-sm text-red-600">
        {error}
      </p>
    </div>
  );
}