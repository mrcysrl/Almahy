"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/types";
import { TRANSITIONS } from "@/lib/orders/transitions";
import { STATUS_BADGE } from "@/lib/status-colors";

export function StatusControl({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [prevProp, setPrevProp] = useState(status);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== prevProp) {
    setPrevProp(status);
    setCurrent(status);
  }

  const options = [current, ...TRANSITIONS[current]];

  async function change(next: OrderStatus) {
    const previous = current;
    setError(null);
    setCurrent(next);
    setPending(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setCurrent(previous);
        setError(data?.error ?? "Could not update status.");
        return;
      }
      router.refresh();
    } catch {
      setCurrent(previous);
      setError("Network error. Status was not changed.");
    } finally {
      setPending(false);
    }
  }

  const isFinal = options.length === 1;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <span className={`badge ${STATUS_BADGE[current]} capitalize`}>
          {current}
        </span>

        {isFinal ? (
          <span className="text-sm text-gray-500">Final status</span>
        ) : (
          <>
            <label htmlFor="order-status" className="sr-only">
              Change status
            </label>
            <select
              id="order-status"
              value={current}
              disabled={pending}
              onChange={(e) => change(e.target.value as OrderStatus)}
              className="input w-auto min-w-40 capitalize"
            >
              {options.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {pending && (
              <span className="text-sm text-gray-500">Updating…</span>
            )}
          </>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      )}
    </div>
  );
}