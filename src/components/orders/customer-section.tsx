"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { customerEditSchema } from "@/lib/orders/schemas";

type Fields = {
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  notes: string;
};
type FieldErrors = Partial<Record<keyof Fields, string>>;
type Issue = { path: ReadonlyArray<PropertyKey>; message: string };

const FIELD_KEYS = ["customerName", "customerEmail", "shippingAddress", "notes"] as const;

function toFieldErrors(issues: ReadonlyArray<Issue>): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const key = FIELD_KEYS.find((k) => k === issue.path[0]);
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

type TextFieldProps = {
  name: keyof Fields;
  label: string;
  value: string;
  error?: string;
  type?: string;
  multiline?: boolean;
  onChange: (value: string) => void;
};

function TextField({ name, label, value, error, type = "text", multiline, onChange }: TextFieldProps) {
  const errorId = `${name}-error`;
  const shared = {
    id: name,
    name,
    value,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? errorId : undefined,
    className: "mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm",
  };
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      {multiline ? (
        <textarea {...shared} rows={3} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...shared} type={type} onChange={(e) => onChange(e.target.value)} />
      )}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

type Props = { orderId: string; initial: Fields; canEdit: boolean };

export function CustomerSection({ orderId, initial, canEdit }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Fields>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  function startEditing() {
    setValues(initial);
    setErrors({});
    setFormError(null);
    setSaved(false);
    setEditing(true);
  }

  function set(name: keyof Fields, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const parsed = customerEditSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    setPending(true);

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
          issues?: Issue[];
        } | null;
        if (res.status === 422 && data?.issues) setErrors(toFieldErrors(data.issues));
        else setFormError(data?.error ?? "Could not save changes.");
        return;
      }
      setEditing(false);
      setSaved(true);
      router.refresh();
    } catch {
      setFormError("Network error. Your changes were not saved.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="customer-heading">
      <div className="mb-2 flex items-center justify-between">
        <h2 id="customer-heading" className="text-lg font-semibold">
          Customer
        </h2>
        {canEdit && !editing && (
          <button type="button" onClick={startEditing} className="rounded border px-3 py-1 text-sm">
            Edit
          </button>
        )}
      </div>

      <p role="status" className="min-h-5 text-sm text-green-700">
        {saved ? "Changes saved." : ""}
      </p>

      {editing ? (
        <form onSubmit={onSubmit} noValidate className="max-w-md space-y-3">
          <TextField name="customerName" label="Name" value={values.customerName} error={errors.customerName} onChange={(v) => set("customerName", v)} />
          <TextField name="customerEmail" label="Email" type="email" value={values.customerEmail} error={errors.customerEmail} onChange={(v) => set("customerEmail", v)} />
          <TextField name="shippingAddress" label="Shipping address" value={values.shippingAddress} error={errors.shippingAddress} onChange={(v) => set("shippingAddress", v)} />
          <TextField name="notes" label="Notes" multiline value={values.notes} error={errors.notes} onChange={(v) => set("notes", v)} />
          <p role="alert" className="min-h-5 text-sm text-red-600">
            {formError}
          </p>
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60">
              {pending ? "Saving..." : "Save"}
            </button>
            <button type="button" disabled={pending} onClick={() => setEditing(false)} className="rounded border px-4 py-2 text-sm disabled:opacity-60">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1 text-sm">
          <dt className="text-gray-600">Name</dt>
          <dd>{initial.customerName}</dd>
          <dt className="text-gray-600">Email</dt>
          <dd>{initial.customerEmail}</dd>
          <dt className="text-gray-600">Shipping address</dt>
          <dd>{initial.shippingAddress}</dd>
          <dt className="text-gray-600">Notes</dt>
          <dd>{initial.notes || "None"}</dd>
        </dl>
      )}
    </section>
  );
}