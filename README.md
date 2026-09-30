# Order Portal

A production-grade admin dashboard and order management portal built with Next.js (App Router), React, TypeScript, Tailwind CSS, and REST API route handlers backed by an in-memory store.

**Live:** https://almahy.vercel.app/login

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

Analytics overview for a chosen date range.

- Four KPI cards: total revenue, order count, average order value, pending orders.
- Revenue-by-day bar chart rendered as inline SVG (no chart library).
- URL-synchronized date-range filter — shareable and preserved on reload.
- Loading skeleton while the route streams in.
- Empty state when the range contains no orders.
- Cancelled orders are excluded from revenue and count; pending is tracked separately.

### Management module (Orders)

Server-driven list with everything a support agent or admin needs to work efficiently.

- **Server-side pagination** — 10 rows per page, `?page=` in the URL.
- **Search** — matches order ID, customer name, or email. Debounced 300 ms.
- **Sorting** — click any column header to toggle ascending/descending. Sort and order are in the URL.
- **Multi-filtering** — combine search, status, and a from/to date range. `From` cannot be later than `To`.
- **URL-synchronized state** — every filter, sort, and page change updates the URL. Back/forward work; links are shareable.
- **Out-of-range guard** — `?page=999` redirects to the last valid page while keeping every other filter.
- **Bulk selection** — tick multiple rows (admin only). The header checkbox becomes indeterminate when partially selected.
- **Bulk actions** — apply a status change or delete in one request. Status transitions that aren't allowed for a given order are skipped and reported.
- **Confirmation modal** — native `<dialog>` for delete and bulk updates. Focus-trapped, Escape closes, focus returns to the trigger.
- **Responsive** — desktop renders a table; mobile renders a card list with the same actions.

### Detail module (Order)

Full view of a single order with editing and history.

- **Dynamic route** — `/orders/[id]`, `notFound()` for bad IDs.
- **Editable customer section** — admin only. Name, email, shipping address, notes. Validated with Zod on the client and the server. Server field errors map back to the correct input.
- **Status control** — optimistic update with rollback on failure. Transition rules prevent illegal moves (e.g. `delivered` → `pending`).
- **Activity timeline** — every event (created, status changed, edited, note added) with actor, timestamp, and a typed payload.
- **Related orders** — up to five other orders from the same customer email.

### Create order (Advanced form)

- **Multi-step** — Customer → Items & shipping → Review.
- **Shared validation** — one Zod schema runs on the client per step and on the server on submit.
- **Conditional field** — the "Gift order" checkbox reveals a gift message textarea.
- **Draft autosave** — debounced to `localStorage` under a per-user key. Restored on reload with a "Draft restored" banner and a "Discard" button. Cleared on successful submit.
- **States** — submitting spinner, success screen with a link to the new order, error banner that preserves the entered data.
- **Admin only** — support is redirected at the page and blocked at the API.

### Auth and access control

- **JWT in an HttpOnly cookie**, signed with `AUTH_SECRET` via `jose`.
- **Role-based access** — `admin` and `support`. The API enforces it server-side; the UI hides what a role cannot do.
- **Route protection** — the `(app)` layout redirects to `/login` if there's no session.
- **Passwords hashed** with bcrypt at startup; plaintext is never stored in the client bundle.

### UI and accessibility

- **Responsive** — every screen works from mobile up.
- **Mobile drawer** — full-screen native `<dialog>` with focus trapping, Escape-to-close, and focus restore. Slides in from the right; respects `prefers-reduced-motion`.
- **Keyboard navigation** — skip-to-content link, visible focus rings (`focus-visible:ring`), native focus management in dialogs.
- **Empty and error states** — every list, chart, and form has a deliberate fallback.
- **Loading states** — route-level skeleton in `(app)/loading.tsx`; inline "Updating…" indicators on mutations.

---

## Tech stack

- **Next.js 16** — App Router, Server Components, route handlers.
- **React 19**
- **TypeScript** — strict mode, no `any` in application code.
- **Tailwind CSS** — utility-first, plus a small set of `@layer components` primitives (`.btn`, `.card`, `.input`, `.label`, `.badge`).
- **Zod** — shared validation between client and server.
- **jose** — JWT signing and verification.
- **bcryptjs** — password hashing.
- **Vitest** — unit tests for critical data logic.

### AI tools used

- **Claude** (free tier) — architecture guidance, code review, refactoring help.
- **DeepSeek** (free tier) — additional code review and debugging support.

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

Deployed on Vercel. Requirements:

- The repo is connected to a Vercel project.
- `AUTH_SECRET` is set as a **Production** environment variable (same value as `.env.local`).
- Redeploy after changing env vars — they don't apply to existing deployments.

---

## Scripts

| Command         | Purpose              |
| --------------- | -------------------- |
| `npm run dev`   | Dev server           |
| `npm run build` | Production build     |
| `npm start`     | Serve production     |
| `npm run lint`  | ESLint               |
| `npm test`      | Run unit tests       |