"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { initials } from "@/lib/initials";

type Props = { userName: string; userRole: string };

export function MobileNav({ userName, userRole }: Props) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [open]);

  const userInitials = initials(userName);

  return (
    <>
      <div className="flex items-center gap-1 md:hidden">
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700"
        >
          {userInitials}
        </button>

        <button
          type="button"
          aria-label="Open navigation"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen(true)}
          className="btn btn-ghost -mr-2 p-2"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </div>

      <dialog
        id="mobile-nav"
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className="mobile-nav fixed inset-0 m-0 h-dvh w-full max-w-none max-h-none border-0 bg-white p-0"
      >
        <div className="flex h-full flex-col bg-white">
          {/* Top bar */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <span className="text-lg font-semibold tracking-tight">
              Order Portal
            </span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="btn btn-ghost -mr-2 p-2"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {/* Account row — avatar + name/role on the left, sign out on the right */}
          <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-gray-900">
                {userName}
              </div>
              <div className="text-sm capitalize text-gray-500">
                {userRole}
              </div>
            </div>
            <LogoutButton />
          </div>

          {/* Nav links — fill remaining space */}
          <nav aria-label="Main" className="flex flex-col gap-1 p-4">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="rounded-md px-4 py-4 text-base font-medium text-gray-900 transition-colors hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Dashboard
            </Link>
            <Link
              href="/orders"
              onClick={() => setOpen(false)}
              className="rounded-md px-4 py-4 text-base font-medium text-gray-900 transition-colors hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Orders
            </Link>
          </nav>
        </div>
      </dialog>
    </>
  );
}