# Order Portal

Admin dashboard and order management portal. Next.js (App Router), React, TypeScript, Tailwind, REST route handlers backed by an in-memory store.

**Live:** https://almahy.vercel.app/

**Recommended for full functionality:** run locally. Writes may not persist on Vercel. See [Runtime notes](#runtime-notes).

---

## Author

**Marc Ysrael Maulion**
Application for IT Support cum Web Developer

- Email: marcysraelmaulion@gmail.com
- Phone: +971 50 331 6743

---

## Demo accounts

| Role    | Email               | Password   |
| ------- | ------------------- | ---------- |
| Admin   | admin@example.com   | admin123   |
| Support | support@example.com | support123 |

Demo credentials only. They are hardcoded in `src/lib/auth/credentials.ts` and shown on the login page for reviewers.

| Action                       | Admin | Support |
| ---------------------------- | ----- | ------- |
| View dashboard, list, detail | Yes   | Yes     |
| Change order status          | Yes   | Yes     |
| Edit customer fields         | Yes   | No      |
| Create order                 | Yes   | No      |
| Delete / bulk actions        | Yes   | No      |

---

## Features

### Dashboard

- Four KPIs: revenue, paid orders, average order value, pending orders.
- Revenue counts orders that have been paid (paid, processing, shipped, delivered). Pending and cancelled orders are excluded from revenue, and pending orders are shown as their own KPI.
- Revenue-by-day chart rendered as inline SVG in a Server Component (no chart library, no client JavaScript), with a visually hidden data table as a text alternative.
- URL-synchronized date-range filter: shareable and preserved on reload.
- Invalid, reversed, or oversized ranges (366 days or more) fall back to the default range instead of erroring.
- The default range is the 30 days ending at the most recent order, so the seeded data always shows something.
- Loading skeleton and empty state.

### Orders (Management module)

- Server-side pagination, 10 rows per page.
- Search across order ID, customer name, and email, debounced 300 ms.
- Column sorting, ascending and descending, with a stable tiebreaker so pages never overlap.
- Multi-filter: search + status + from/to date range.
- URL-synchronized state: Back, reload, and shared links all work.
- Out-of-range page guard: `?page=999` redirects to the last valid page while keeping other filters.
- Bulk selection and bulk actions (admin only): status update and delete, with a confirmation modal. Transitions that are not allowed are skipped and reported.
- Responsive: table on desktop, card list on mobile. On mobile, sorting and select-all are not available; rows can still be selected individually.

### Order detail

- Dynamic route `/orders/[id]` with `notFound()` for bad IDs.
- Editable customer section (admin only): name, email, shipping address, notes. Validated client-side and server-side; server field errors map back to the correct input.
- Status control with optimistic update and rollback. Transition rules are enforced on the server (HTTP 409) and the UI offers only allowed next statuses.
- Activity timeline: created, status changed, and edited events with actor, timestamp, and typed payload. The event type system also defines `note_added`, but there is no UI to add notes yet.
- Related orders from the same customer email.

### Create order (advanced form)

- Multi-step: Customer, Items & shipping, Review.
- Shared Zod schemas between client (validated per step) and server (validated on submit).
- Conditional field: the "Gift order" checkbox reveals a required gift-message field.
- Draft autosave to `localStorage` under a per-user key, with a "Draft saved" indicator, a "restored" banner, and a Discard button. Cleared on successful submit.
- Loading, success, and error states. The error banner preserves entered data.
- Admin only: support users are redirected at the page and blocked at the API.

### Auth and access control

- JWT in an HttpOnly, SameSite=Lax cookie (Secure in production), signed with `AUTH_SECRET` via `jose`, 8-hour expiry.
- Roles: `admin` and `support`. Enforced on the server in every protected route handler (`authorize()` in `src/lib/auth/guard.ts`). The UI also hides what a role cannot do, but the UI is not the security boundary.
- Route protection in layers:
  - `src/proxy.ts` redirects requests with no session cookie to `/login`. This is an optimistic check only, not a verification.
  - Each protected page calls `requireUser()`, which verifies the JWT, so protection does not depend on the layout re-rendering.
  - The `(app)` layout also verifies the session.
- The user's role is re-read from server data on every request, never trusted from the token.
- Passwords are hashed with bcrypt at startup. Login always runs a hash comparison so response time does not reveal whether an email exists. Plaintext is never sent to the client.

### UI and accessibility

- Responsive layout with a mobile navigation drawer.
- Native `<dialog>` for the mobile drawer and the confirmation modal: Escape to close, page content inert while open, focus returned on close.
- Keyboard navigation: skip-to-content link, visible focus rings, labelled form fields, `aria-sort` on sortable columns, `aria-invalid` and `aria-describedby` on invalid inputs.
- Status messages use live regions (`role="status"` and `role="alert"`).
- Fade-in step transition respects `prefers-reduced-motion`.
- Light theme only.

---

## Tech stack

- Next.js 16: App Router, Server Components, route handlers, `proxy.ts`
- React 19
- TypeScript: strict
- Tailwind CSS: utility-first plus a small `@layer components` set (`.btn`, `.card`, `.input`, `.label`, `.badge`)
- Zod: shared validation
- jose: JWT sign/verify
- bcryptjs: password hashing
- Vitest: unit tests

### AI tools used

- **Claude** (free tier): architecture guidance, code review, refactoring support.
- **DeepSeek** (free tier): additional review and debugging assistance.

---

## Setup

```bash
npm install
```

Copy `.env.example` to `.env.local` and set the value:

```txt
AUTH_SECRET=<at least 32 characters; 64-char hex recommended>
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

### Environment variables

| Variable      | Required | Purpose                                                                                   |
| ------------- | -------- | ----------------------------------------------------------------------------------------- |
| `AUTH_SECRET` | Yes      | Signs session JWTs. Minimum 32 characters. Server only; never prefix with `NEXT_PUBLIC_`. |

`.env.local` is git-ignored. `.env.example` is committed and contains no secrets.

---

## Deployment

Deployed on Vercel.

- Repo connected to a Vercel project.
- `AUTH_SECRET` set as a **Production** environment variable.
- Redeploy after changing env vars. New values only apply to new deployments.

---

## Runtime notes

This app uses an **in-memory store** (`src/lib/db/index.ts`, seeded by `src/lib/db/seed.ts`) instead of a database.

### Local development

`npm run dev` runs a single Node process, so all reads and writes share the same memory. Every feature works end to end. Changes persist until the process restarts, and the store is kept on `globalThis` so hot reloads do not reseed it.

### Vercel (serverless)

Vercel may run multiple function instances behind the same URL, and each instance has its own copy of the store. As a result:

- **Read** flows work: dashboard, orders list, filters, sorting, pagination, order detail, timeline display.
- **Write** flows (status change, customer edit, bulk actions, create order) may appear to revert or disappear if the next request lands on a different instance.

This is a consequence of in-memory storage on a serverless runtime, not a bug in the application logic.

**Fixing it** means replacing the store with a shared database or Redis. The data access functions are currently synchronous, so this requires making `lib/orders/mutations.ts`, the `queryOrders` call sites, and the pages that read `db` async. It is a contained change, but not a one-file swap.

**For a full demo, run locally.**

---

## Data model

- `Role`: `"admin" | "support"`
- `User`: id, name, email, role
- `OrderStatus`: `pending`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`
- `OrderItem`: id, product name, quantity, unit price in cents
- `Order`: id, customer info, shipping address, status, line items, notes, optional gift message, total in cents, timestamps
- `OrderEvent`: discriminated union on `type` (`created`, `status_changed`, `edited`, `note_added`), with actor (id + name) and timestamp

Allowed status transitions (`src/lib/orders/transitions.ts`):

| From       | To                    |
| ---------- | --------------------- |
| pending    | paid, cancelled       |
| paid       | processing, cancelled |
| processing | shipped, cancelled    |
| shipped    | delivered             |
| delivered  | none (final)          |
| cancelled  | none (final)          |

**Money** is stored as integer cents to avoid floating-point drift. Formatting divides by 100 for display only. The server computes `totalCents` from the line items and never trusts a client-supplied total.

**Dates** are ISO 8601 UTC strings: unambiguous, sortable, and timezone-safe. Display formatting pins `timeZone: "UTC"` so server and browser render the same value.

---

## Requirements coverage

| #  | Area        | Where |
| -- | ----------- | ----- |
| 1  | Dashboard   | `app/(app)/page.tsx`, `lib/dashboard.ts`, `components/dashboard/` |
| 2  | Management  | `app/(app)/orders/page.tsx`, `components/orders/orders-table.tsx`, `orders-filters.tsx`, `lib/orders/query.ts` |
| 3  | Detail      | `app/(app)/orders/[id]/page.tsx`, `order-timeline.tsx`, `status-control.tsx`, `customer-section.tsx` |
| 4  | Forms       | `components/orders/create-order-form.tsx`, `lib/orders/schemas.ts` |
| 5  | API & State | REST handlers in `app/api/orders/`, `lib/orders/mutations.ts`. Optimistic update with rollback in `status-control.tsx`. After mutations, data is revalidated with `router.refresh()`; there is no separate client cache layer. |
| 6  | UI/UX       | Skip link and mobile drawer (`(app)/layout.tsx`, `components/mobile-nav.tsx`), route skeleton (`(app)/loading.tsx`), empty states on dashboard and orders, inline field errors and error banners in forms |
| 7  | Performance | Server-side filtering and pagination, debounced inputs, `useTransition` for pending UI, Server Components read data directly (no self-fetch), chart rendered server-side so it ships no JavaScript |
| 8  | Security    | See Auth and access control above: JWT HttpOnly cookie, `authorize()` on every API route, `requireUser()` on pages, Zod on all inputs, `AUTH_SECRET` from env, no secrets in Git |
| 9  | Engineering | Layered `lib/` (auth, orders, dashboard), shared types, strict TypeScript, conventional-style commits, Vitest for dashboard data logic |
| 10 | Deployment  | Vercel deployment, env documented above |

---

## Testing

```bash
npm test
```

Vitest unit tests cover the dashboard data logic: default range, range validation and fallback, revenue rules (cancelled and pending excluded), boundary days, and the zero-filled daily series.

Not covered by automated tests: the orders query logic, transition rules, the create-order schema, and the UI components. They were verified manually, including the full create-order flow, bulk actions, and role restrictions.

---

## Deliberate trade-offs

- **In-memory data**: see [Runtime notes](#runtime-notes) for the Vercel implication and the migration path.
- **Hardcoded demo users**: for the assessment only. In production these belong in a database or identity provider.
- **No login rate limiting or CSRF tokens**: the session cookie is SameSite=Lax, and mutations are JSON requests. A production system would add rate limiting and further CSRF protection.
- **Deleting an order deletes its history**: a real system would soft-delete and keep an audit trail.
- **No route-level error boundary (`error.tsx`)**: handlers return structured errors and forms show inline error states, but an uncaught server error shows the framework default.
- **No OAuth, no E2E suite, no dark theme, no real-time updates**: traded for a coherent vertical slice within the assessment budget. Other tabs see changes only after navigating or refreshing.
- **No images**: `next/image` and image lazy loading are not applicable to this app.

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

1. Log in as **admin**: dashboard, orders list, bulk actions.
2. Log in as **support**: no bulk actions, no customer edit, no create page.
3. `/orders?page=999` redirects to the last valid page.
4. `/orders?status=shipped&from=2026-09-01` survives reload and Back.
5. `/?from=abcdefghij` shows the default dashboard instead of an error.
6. `/orders/new`: multi-step form, autosave survives refresh, server validation surfaces field errors on the correct step.
7. `/orders/[id]`: edit the customer, change the status, watch the timeline update.

> Steps 6 and 7 involve writes. To see them persist reliably, run locally.