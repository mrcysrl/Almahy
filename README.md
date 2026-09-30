# Order Portal

Admin dashboard and order management portal. Next.js (App Router), React, TypeScript, Tailwind, REST route handlers backed by an in-memory store.

**Live:** https://almahy.vercel.app/

**Recommended for full functionality:** run locally. See [Runtime notes](#runtime-notes).

---

## Author

**Marc Ysrael Maulion**
Application for IT Support cum Web Developer

- Email: marcysraelmaulion@gmail.com
- Phone: +971 50 331 6743

---

## Demo accounts

| Role    | Email                 | Password   |
| ------- | --------------------- | ---------- |
| Admin   | admin@example.com     | admin123   |
| Support | support@example.com   | support123 |

---

## Features

### Dashboard

- Four KPIs: revenue, order count, average order value, pending orders.
- Revenue-by-day chart rendered as inline SVG (no chart library).
- URL-synchronized date-range filter — shareable and preserved on reload.
- Loading skeleton and empty state.

### Orders (Management module)

- Server-side pagination, 10 rows per page.
- Search across order ID, customer name, and email — debounced 300 ms.
- Column sorting, ascending and descending.
- Multi-filter: search + status + from/to date range.
- URL-synchronized state — Back, reload, and shared links all work.
- Out-of-range page guard: `?page=999` redirects to the last valid page while keeping other filters.
- Bulk selection and bulk actions (admin only): status update and delete, with a confirmation modal. Illegal transitions are skipped and reported.
- Responsive: table on desktop, card list on mobile.

### Order detail

- Dynamic route `/orders/[id]` with `notFound()` for bad IDs.
- Editable customer section (admin only): name, email, shipping address, notes. Validated client-side and server-side; server field errors map back to the correct input.
- Status control with optimistic update and rollback. Transition rules prevent illegal moves (e.g. `delivered` → `pending`).
- Activity timeline: every event (created, status changed, edited, note added) with actor, timestamp, and typed payload.
- Related orders from the same customer email.

### Create order (Advanced form)

- Multi-step: Customer → Items & shipping → Review.
- Shared Zod validation between client (per step) and server (on submit).
- Conditional field: "Gift order" checkbox reveals a gift-message textarea.
- Draft autosave to `localStorage` under a per-user key, with a "Draft restored" banner and a Discard button. Cleared on successful submit.
- Loading, success, and error states. Error banner preserves entered data.
- Admin only. Support is redirected at the page and blocked at the API.

### Auth and access control

- JWT in an HttpOnly cookie, signed with `AUTH_SECRET` via `jose`.
- Roles: `admin` and `support`. Enforced on the server in every protected route handler; the UI hides what a role cannot do.
- Route protection: the `(app)` layout redirects to `/login` if there is no session.
- Passwords hashed with bcrypt at startup. Plaintext is never sent to the client.

### UI and accessibility

- Fully responsive.
- Mobile drawer: native `<dialog>` with focus trapping, Escape to close, and focus restore. Respects `prefers-reduced-motion`.
- Keyboard navigation: skip-to-content link, `focus-visible` rings, native focus management in dialogs.
- Empty, error, and loading states on every screen.

---

## Tech stack

- Next.js 16 — App Router, Server Components, route handlers
- React 19
- TypeScript — strict, no `any` in application code
- Tailwind CSS — utility-first plus a small `@layer components` set (`.btn`, `.card`, `.input`, `.label`, `.badge`)
- Zod — shared validation
- jose — JWT sign/verify
- bcryptjs — password hashing
- Vitest — unit tests for dashboard data logic

### AI tools used

- **Claude** (free tier) — architecture guidance, code review, refactoring support.
- **DeepSeek** (free tier) — additional review and debugging assistance.

---

## Setup

```bash
npm install
```

Create `.env.local`:

```txt
AUTH_SECRET=<64-char hex string>
```

Generate one:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run the dev server:

```bash
npm run dev
# http://localhost:3000
```

---

## Deployment

Deployed on Vercel.

- Repo connected to a Vercel project.
- `AUTH_SECRET` set as a **Production** environment variable (same value as `.env.local`).
- Redeploy after changing env vars — new values only apply to new deployments.

---

## Runtime notes

This app uses an **in-memory store** (`src/lib/db.ts`) instead of a database. That choice has consequences for how it behaves in different environments.

### Local development

`npm run dev` runs a single Node process. All reads and writes share the same memory. **Every feature works end to end** — status changes, customer edits, bulk actions, and order creation all persist until the process restarts.

### Vercel (serverless)

Vercel may run multiple function instances behind the same URL. Reads and writes can land on different instances, each with its own copy of the store. As a result:

- All **read** flows work: dashboard, orders list, filters, sorting, pagination, order detail, timeline display.
- **Write** flows (status change, customer edit, bulk update, create order) may not appear on the next read if the request landed on a different instance than the one that wrote.

This is an architectural consequence of the in-memory store on a serverless runtime, not a bug. The fix is to swap `src/lib/db.ts` for a database or Redis client behind the same interface — no other file changes.

**For a full demo, run locally.**

---

## Data model

- `Role` — `"admin" | "support"`
- `User` — id, name, email, role
- `OrderStatus` — `pending`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`
- `OrderItem` — id, product name, quantity, unit price in cents
- `Order` — id, customer info, shipping address, status, line items, notes, optional gift message, total in cents, timestamps
- `OrderEvent` — id, order id, actor (id + name), kind (`created` / `status_changed` / `edited` / `note_added`), typed payload, timestamp

**Money** is stored as integer cents to avoid floating-point drift. Formatting divides by 100 for display only.

**Dates** are ISO 8601 UTC strings — unambiguous, sortable, timezone-safe.

---

## Requirements coverage

| # | Area | Where |
| --- | --- | --- |
| 1 | Dashboard | `app/(app)/page.tsx`, `lib/dashboard.ts`, `components/dashboard/` |
| 2 | Management | `app/(app)/orders/page.tsx`, `components/orders/orders-table.tsx`, `orders-filters.tsx`, `lib/orders/query.ts` |
| 3 | Detail | `app/(app)/orders/[id]/page.tsx`, `order-timeline.tsx`, `status-control.tsx` |
| 4 | Forms | `components/orders/create-order-form.tsx`, `lib/orders/schemas.ts` |
| 5 | API & State | `app/api/orders/`, `lib/orders/mutations.ts`, optimistic updates in `orders-table.tsx` and `status-control.tsx` |
| 6 | UI/UX | Skip link and mobile drawer in `(app)/layout.tsx` and `components/mobile-nav.tsx`, skeleton in `(app)/loading.tsx`, empty states on dashboard and orders |
| 7 | Performance | Server-side queries, debounced inputs, `useTransition`, no client-side data fetching where Server Components suffice |
| 8 | Security | JWT HttpOnly cookie, `lib/auth/guard.ts` on every protected route, Zod on all inputs, `AUTH_SECRET` env var |
| 9 | Engineering | Layered `lib/`, TypeScript strict, conventional commits, Vitest for dashboard data |
| 10 | Deployment | Vercel deployment, env documented above |

---

## Deliberate trade-offs

- **In-memory data** — swappable for a database behind `src/lib/db.ts`. See [Runtime notes](#runtime-notes) for the Vercel implication.
- **Hardcoded demo users** — documented above for the assessment. In production these belong in a database or identity provider.
- **No OAuth, no E2E suite, no dark theme** — traded for a coherent vertical slice within the assessment budget.
- **No images** — `next/image` and lazy loading are not applicable to this app.

---

## Scripts

| Command         | Purpose          |
| --------------- | ---------------- |
| `npm run dev`   | Dev server       |
| `npm run build` | Production build |
| `npm start`     | Serve production |
| `npm run lint`  | ESLint           |
| `npm test`      | Unit tests       |

---

## What to check first

1. Log in as **admin** — dashboard, orders list, bulk actions.
2. Log in as **support** — no bulk actions, no customer edit, no create page.
3. `/orders?page=999` redirects to the last valid page.
4. `/orders?status=shipped&from=2026-09-01` survives reload and Back.
5. `/orders/new` — multi-step form, autosave survives refresh, server validation surfaces field errors on the correct step.
6. `/orders/[id]` — edit the customer, change the status, watch the timeline update.

> Steps 1, 5, and 6 involve writes. To see them persist, run locally.