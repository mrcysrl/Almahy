"use client";

import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pending = false,
  error,
  onConfirm,
  onCancel,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
      onCancel={(e) => {
        // Esc key: let React state decide, and block closing mid-request
        e.preventDefault();
        if (!pending) onCancel();
      }}
      className="m-auto w-full max-w-md rounded-lg p-6 backdrop:bg-black/40"
    >
      <h2 id="confirm-title" className="text-lg font-semibold">
        {title}
      </h2>
      <p id="confirm-desc" className="mt-2 text-sm text-gray-700">
        {description}
      </p>
      <p role="alert" className="mt-2 min-h-5 text-sm text-red-600">
        {error}
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          autoFocus
          onClick={onCancel}
          disabled={pending}
          className="rounded border px-3 py-2 text-sm disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-60"
        >
          {pending ? "Working..." : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}