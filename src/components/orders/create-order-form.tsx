"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { z } from "zod";
import {
  createOrderSchema,
  customerStepSchema,
  detailsStepSchema,
} from "@/lib/orders/schemas";
import { parseDollarsToCents } from "@/lib/money";
import { formatCents } from "@/lib/format";
import { TextField } from "@/components/ui/text-field";

/* Form state is all strings, so half-typed input never fights the user.
   Conversion to cents/numbers happens only in toPayload(). */
const draftSchema = z.object({
  customerName: z.string(),
  customerEmail: z.string(),
  notes: z.string(),
  shippingAddress: z.string(),
  isGift: z.boolean(),
  giftMessage: z.string(),
  items: z
    .array(
      z.object({
        key: z.string(),
        productName: z.string(),
        quantity: z.string(),
        unitPrice: z.string(),
      }),
    )
    .min(1)
    .max(20),
});

type Draft = z.infer<typeof draftSchema>;
type ItemDraft = Draft["items"][number];
type Errors = Record<string, string>;
type Issue = { path: ReadonlyArray<PropertyKey>; message: string };
type Phase = "editing" | "submitting" | "success";

const STEPS = ["Customer", "Items & shipping", "Review"] as const;
const LAST_STEP = STEPS.length - 1;

const EMPTY_ITEM: ItemDraft = {
  key: "item-0",
  productName: "",
  quantity: "1",
  unitPrice: "",
};
const EMPTY_DRAFT: Draft = {
  customerName: "",
  customerEmail: "",
  notes: "",
  shippingAddress: "",
  isGift: false,
  giftMessage: "",
  items: [EMPTY_ITEM],
};

function toPayload(d: Draft) {
  return {
    customerName: d.customerName,
    customerEmail: d.customerEmail,
    notes: d.notes,
    shippingAddress: d.shippingAddress,
    isGift: d.isGift,
    giftMessage: d.isGift ? d.giftMessage : undefined,
    items: d.items.map((it) => ({
      productName: it.productName,
      quantity: /^\d+$/.test(it.quantity.trim()) ? Number(it.quantity) : 0,
      unitPriceCents: parseDollarsToCents(it.unitPrice) ?? 0,
    })),
  };
}

function toErrors(issues: ReadonlyArray<Issue>): Errors {
  const errors: Errors = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (!(key in errors)) errors[key] = issue.message;
  }
  return errors;
}

function stepForField(root: PropertyKey | undefined): number {
  return root === "customerName" || root === "customerEmail" || root === "notes"
    ? 0
    : 1;
}

export function CreateOrderForm({ userId }: { userId: string }) {
  const storageKey = `draft:create-order:${userId}`;

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [phase, setPhase] = useState<Phase>("editing");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [restored, setRestored] = useState(false);
  const [saved, setSaved] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Restore a saved draft once, after mount (localStorage does not exist on the server)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = draftSchema.safeParse(JSON.parse(raw));
        if (parsed.success) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setDraft(parsed.data);
          setRestored(true);
        }
      }
    } catch {
      // corrupt or blocked storage: start with an empty form
    }
    setReady(true);
  }, [storageKey]);

  // Debounced autosave
  useEffect(() => {
    if (!ready || phase !== "editing") return;
    const timer = setTimeout(() => {
      try {
        if (JSON.stringify(draft) === JSON.stringify(EMPTY_DRAFT)) {
          localStorage.removeItem(storageKey);
          setSaved(false);
        } else {
          localStorage.setItem(storageKey, JSON.stringify(draft));
          setSaved(true);
        }
      } catch {
        // storage full or blocked: autosave is best-effort
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [draft, ready, phase, storageKey]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function updateItem(index: number, patch: Partial<ItemDraft>) {
    setDraft((d) => ({
      ...d,
      items: d.items.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    }));
  }

  function addItem() {
    setDraft((d) =>
      d.items.length >= 20
        ? d
        : {
            ...d,
            items: [
              ...d.items,
              {
                key: crypto.randomUUID(),
                productName: "",
                quantity: "1",
                unitPrice: "",
              },
            ],
          },
    );
  }

  function removeItem(index: number) {
    setDraft((d) =>
      d.items.length <= 1
        ? d
        : { ...d, items: d.items.filter((_, i) => i !== index) },
    );
  }

  function goTo(target: number) {
    setStep(target);
    // Move focus to the new step heading so keyboard and screen-reader users land in the right place
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  function validateStep(target: number): boolean {
    const payload = toPayload(draft);
    const result =
      target === 0
        ? customerStepSchema.safeParse(payload)
        : detailsStepSchema.safeParse(payload);
    if (result.success) {
      setErrors({});
      return true;
    }
    setErrors(toErrors(result.error.issues));
    return false;
  }

  async function submit() {
    setSubmitError(null);

    const parsed = createOrderSchema.safeParse(toPayload(draft));
    if (!parsed.success) {
      setErrors(toErrors(parsed.error.issues));
      goTo(stepForField(parsed.error.issues[0]?.path[0]));
      return;
    }

    setPhase("submitting");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
          issues?: Issue[];
        } | null;

        if (res.status === 422 && data?.issues?.length) {
          // Server-side validation: map errors back onto the right step and fields
          setErrors(toErrors(data.issues));
          goTo(stepForField(data.issues[0].path[0]));
          setSubmitError(
            "The server rejected some fields. Please review and try again.",
          );
        } else if (res.status === 401 || res.status === 403) {
          setSubmitError(
            "You are not allowed to create orders. Sign in as an admin.",
          );
        } else {
          setSubmitError(
            data?.error ??
              "Could not create the order. Your draft is safe, please try again.",
          );
        }
        setPhase("editing");
        return;
      }

      const order = (await res.json()) as { id: string };
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // ignore: nothing to clear
      }
      setCreatedId(order.id);
      setPhase("success");
    } catch {
      setSubmitError("Network error. Your draft is safe, please try again.");
      setPhase("editing");
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (phase === "submitting") return;
    if (step < LAST_STEP) {
      if (validateStep(step)) goTo(step + 1);
      return;
    }
    void submit();
  }

  function resetForm() {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    setDraft(EMPTY_DRAFT);
    setStep(0);
    setErrors({});
    setSubmitError(null);
    setCreatedId(null);
    setRestored(false);
    setSaved(false);
    setPhase("editing");
  }

  const payload = toPayload(draft);
  const totalCents = payload.items.reduce(
    (sum, it) => sum + it.quantity * it.unitPriceCents,
    0,
  );
  const submitting = phase === "submitting";

  if (phase === "success" && createdId) {
    return (
      <div
        role="status"
        className="max-w-md space-y-3 rounded border border-green-300 bg-green-50 p-6"
      >
        <h2 className="text-lg font-semibold">Order created</h2>
        <p className="text-sm">
          Order {createdId} was created with status pending.
        </p>
        <div className="flex gap-4 text-sm">
          <Link href={`/orders/${createdId}`} className="underline">
            View order
          </Link>
          <button type="button" onClick={resetForm} className="underline">
            Create another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-busy={submitting}
      className="max-w-2xl space-y-6"
    >
      {restored && (
        <div
          role="status"
          className="flex items-center justify-between rounded border bg-blue-50 p-3 text-sm"
        >
          <span>We restored your unsaved draft.</span>
          <button type="button" onClick={resetForm} className="underline">
            Discard draft
          </button>
        </div>
      )}

      <nav aria-label="Progress">
        <ol className="flex flex-wrap gap-2 text-sm">
          {STEPS.map((label, i) => (
            <li
              key={label}
              aria-current={i === step ? "step" : undefined}
              className={`rounded-full border px-3 py-1 ${
                i === step
                  ? "bg-black text-white"
                  : i < step
                    ? "bg-gray-100"
                    : "text-gray-600"
              }`}
            >
              {i + 1}. {label}
            </li>
          ))}
        </ol>
      </nav>

      <div key={step} className="animate-fade-in space-y-4">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-semibold focus:outline-none"
        >
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </h2>

        {step === 0 && (
          <>
            <TextField
              id="customerName"
              label="Customer name"
              autoComplete="off"
              value={draft.customerName}
              onChange={(v) => update("customerName", v)}
              error={errors.customerName}
            />
            <TextField
              id="customerEmail"
              label="Customer email"
              type="email"
              autoComplete="off"
              value={draft.customerEmail}
              onChange={(v) => update("customerEmail", v)}
              error={errors.customerEmail}
            />
            <TextField
              id="notes"
              label="Notes (optional)"
              multiline
              value={draft.notes}
              onChange={(v) => update("notes", v)}
              error={errors.notes}
            />
          </>
        )}

        {step === 1 && (
          <>
            <TextField
              id="shippingAddress"
              label="Shipping address"
              value={draft.shippingAddress}
              onChange={(v) => update("shippingAddress", v)}
              error={errors.shippingAddress}
            />

            <div className="flex items-center gap-2">
              <input
                id="isGift"
                type="checkbox"
                checked={draft.isGift}
                onChange={(e) => update("isGift", e.target.checked)}
              />
              <label htmlFor="isGift" className="text-sm font-medium">
                This is a gift order
              </label>
            </div>
            {draft.isGift && (
              <TextField
                id="giftMessage"
                label="Gift message"
                multiline
                value={draft.giftMessage}
                onChange={(v) => update("giftMessage", v)}
                error={errors.giftMessage}
              />
            )}

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">Items</legend>
              {errors.items && (
                <p role="alert" className="text-sm text-red-600">
                  {errors.items}
                </p>
              )}
              {draft.items.map((item, i) => (
                <div
                  key={item.key}
                  className="grid grid-cols-1 gap-3 rounded border p-3 sm:grid-cols-[1fr_6rem_8rem_auto] sm:items-start"
                >
                  <TextField
                    id={`item-${item.key}-name`}
                    label="Product"
                    srSuffix={` (item ${i + 1})`}
                    value={item.productName}
                    onChange={(v) => updateItem(i, { productName: v })}
                    error={errors[`items.${i}.productName`]}
                  />
                  <TextField
                    id={`item-${item.key}-qty`}
                    label="Qty"
                    srSuffix={` (item ${i + 1})`}
                    inputMode="numeric"
                    value={item.quantity}
                    onChange={(v) => updateItem(i, { quantity: v })}
                    error={errors[`items.${i}.quantity`]}
                  />
                  <TextField
                    id={`item-${item.key}-price`}
                    label="Unit price ($)"
                    srSuffix={` (item ${i + 1})`}
                    inputMode="decimal"
                    placeholder="12.50"
                    value={item.unitPrice}
                    onChange={(v) => updateItem(i, { unitPrice: v })}
                    error={errors[`items.${i}.unitPriceCents`]}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    disabled={draft.items.length === 1}
                    aria-label={`Remove item ${i + 1}`}
                    className="rounded border px-3 py-2 text-sm disabled:opacity-50 sm:mt-6"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addItem}
                disabled={draft.items.length >= 20}
                className="rounded border px-3 py-2 text-sm disabled:opacity-50"
              >
                Add item
              </button>
            </fieldset>

            <p className="text-sm">
              Order total: <strong>{formatCents(totalCents)}</strong>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1 text-sm">
              <dt className="text-gray-600">Name</dt>
              <dd>{draft.customerName}</dd>
              <dt className="text-gray-600">Email</dt>
              <dd>{draft.customerEmail}</dd>
              <dt className="text-gray-600">Shipping address</dt>
              <dd>{draft.shippingAddress}</dd>
              {draft.notes.trim() && (
                <>
                  <dt className="text-gray-600">Notes</dt>
                  <dd>{draft.notes}</dd>
                </>
              )}
              {draft.isGift && (
                <>
                  <dt className="text-gray-600">Gift message</dt>
                  <dd>{draft.giftMessage}</dd>
                </>
              )}
            </dl>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Order items</caption>
                <thead className="border-b">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left">
                      Product
                    </th>
                    <th scope="col" className="px-3 py-2 text-right">
                      Qty
                    </th>
                    <th scope="col" className="px-3 py-2 text-right">
                      Unit price
                    </th>
                    <th scope="col" className="px-3 py-2 text-right">
                      Line total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payload.items.map((it, i) => (
                    <tr key={draft.items[i].key} className="border-b">
                      <td className="px-3 py-2">{it.productName}</td>
                      <td className="px-3 py-2 text-right">{it.quantity}</td>
                      <td className="px-3 py-2 text-right">
                        {formatCents(it.unitPriceCents)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatCents(it.quantity * it.unitPriceCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th
                      scope="row"
                      colSpan={3}
                      className="px-3 py-2 text-right"
                    >
                      Total
                    </th>
                    <td className="px-3 py-2 text-right font-semibold">
                      {formatCents(totalCents)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>

      <p role="alert" className="min-h-5 text-sm text-red-600">
        {submitError}
      </p>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => goTo(step - 1)}
          disabled={step === 0 || submitting}
          className="rounded border px-4 py-2 text-sm disabled:opacity-50"
        >
          Back
        </button>
        <div className="flex items-center gap-3">
          <p role="status" className="text-xs text-gray-600">
            {saved ? "Draft saved" : ""}
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {step < LAST_STEP
              ? "Next"
              : submitting
                ? "Creating..."
                : "Create order"}
          </button>
        </div>
      </div>
    </form>
  );
}
