# CRM Dashboard — Project Context

> Purpose: give any developer or AI agent full working context in one read,
> so feature work can start immediately without re-exploring the codebase.
> Last updated: 2026-08-25 (after implementing the Advanced Filters Panel).

## 1. What this is

A CRM dashboard for managing customers (list, search, filter, sort, paginate,
add/edit/delete, detail view). Interview-prep project — intentionally uses a
mock in-memory data store that resets on dev-server restart.

## 2. Tech stack (exact, and the non-obvious parts)

| Concern      | Choice | Gotcha |
|--------------|--------|--------|
| Framework    | Next.js **16.3.2** (App Router, Turbopack default) | NOT the Next.js you know: async Request APIs enforced (`params`/`searchParams` are Promises), global type helpers `PageProps<'/route'>` / `LayoutProps<'/route'>` used WITHOUT import, `middleware.ts` renamed to `proxy.ts`, `next lint` removed. Docs bundled at `node_modules/next/dist/docs/` — read before writing Next-specific code. |
| UI           | React **19.2.8**, TypeScript 5 | |
| Styling      | Tailwind CSS **v4**, CSS-first config (`@theme inline` in `app/globals.css`, oklch tokens). NO `tailwind.config.js`. | |
| Components   | shadcn-style, style `"base-nova"`, but built on **`@base-ui/react` primitives (NOT Radix)** | Base UI API: `render={<Button/>}` prop instead of Radix `asChild`; state attributes are `data-checked` / `data-unchecked` / `data-indeterminate` (NOT `aria-checked`); `data-starting-style` / `data-ending-style` for animations. Checkbox renders a fragment: visual `<span role="checkbox">` + hidden `<input>` sibling (`position: fixed` at viewport 0,0 — all inputs stack). |
| Server state | TanStack Query v5 (`hooks/use-customers.ts`) | Query keys: lists `["customers", params]`, detail `["customers", id]`, companies `["companies"]`. Invalidations use prefix `["customers"]`. |
| Forms        | react-hook-form + zod v4 via `Form*Field` Controller wrappers (`components/ui/form-*.tsx`) | |
| Toasts      | `sonner` (`toast.success/error`) | |
| Icons        | `lucide-react` | |
| Pkg manager  | pnpm 10 | |

Installed but currently unused: `@tanstack/react-table`, `@dnd-kit/*`, `next-themes` (used by mode-toggle), `@base-ui/react` combobox/autocomplete/toggle-group (no wrappers yet).

## 3. Commands

```
pnpm dev              # dev server on :3000 (Turbopack)
pnpm build            # production build (does NOT lint)
pnpm lint             # plain `eslint` (NOT `next lint`)
npx tsc --noEmit      # typecheck — no `typecheck` script exists; run manually
```

Lint is STRICT: `react-hooks/set-state-in-effect` errors on synchronous
setState inside effects. Patterns used instead: state initializers
(`useState(() => …)`), remount-on-open subcomponents, or callbacks.

## 4. Directory map (no `src/` — root-level folders)

```
app/
  layout.tsx                  # root layout: sidebar shell + providers; uses LayoutProps<"/">
  providers.tsx               # "use client" — QueryClientProvider
  page.tsx                    # "/" dashboard placeholder (server component)
  customers/page.tsx          # ★ MAIN PAGE: "use client"; owns search/sort/pagination/filter state
  api/customers/route.ts      # GET (filter+search+sort+paginate) + POST
  api/customers/[id]/route.ts # GET/PATCH/DELETE by id
  api/customers/companies/route.ts # GET distinct company names (for filter dropdown)
components/
  ui/                         # shadcn-style primitives (Base UI under the hood)
  customers/                  # feature components (table, cards, dialogs, detail sheet, filters panel)
  app-sidebar.tsx, nav-main.tsx, header-breadcrumb.tsx, mode-toggle.tsx
hooks/
  use-customers.ts            # all TanStack Query hooks (lists, detail, mutations, useCompanies)
  use-customer-row-actions.ts # shared overlay state (detail sheet / edit dialog / delete confirm)
  use-mobile.ts
lib/
  types.ts                    # ★ domain contract — UI imports ONLY types from here
  mock-data.ts                # in-memory store: 150 deterministic customers, mutated by API routes
  api-client.ts               # typed fetch wrappers + query-string builder (arrays -> comma lists)
  customer-filters.ts         # filter state shape, templates, saved-filter persistence (localStorage)
  customer-schema.ts          # zod schema for customer form
  utils.ts                    # cn()
```

## 5. Data flow (one direction, clean seams)

```
mock-data.ts (module-level `let customers[]`)
  ↑ mutated by            ↓ read by
API route handlers (app/api/customers/*)   ← swap point for a real DB
  ↓ JSON
api-client.ts (request<T> throws on !ok; buildQueryString skips empty values)
  ↓
TanStack Query (useCustomers(params) — params object IS the query key)
  ↓
app/customers/page.tsx (all list UI state lives here)
  ↓ props
CustomerTableSection (hidden md:block) / CustomerCardsSection (md:hidden) — pure CSS switch
```

Overlays (detail Sheet, edit Dialog, delete AlertDialog) are rendered ONCE at
page level, driven by `useCustomerRowActions()` — rows/cards only trigger.
WHY: avoids mounting dozens of portal'd overlays per table.

## 6. Domain model (lib/types.ts)

`Customer`: id, name, email, phone (`+1 (XXX) XXX-XXXX`), company, status
(`"active" | "inactive"`), lastContactDate (ISO YYYY-MM-DD), notes?, createdAt.
`CustomerListParams`: search, status[], company[], dateFrom, dateTo, phone,
email, sortBy (name|email|lastContactDate), sortOrder, page, pageSize.

API filter semantics (GET /api/customers): all filters AND-ed. search matches
name/email/company (case-insensitive contains); status/company are exact-match
lists; dates are plain ISO string compare; phone matches DIGITS-ONLY partial;
email is case-insensitive partial. `total` = count AFTER filter, BEFORE
pagination (drives page count).

## 7. Conventions (match these or get flagged)

- `"use client"` at top; `import * as React from "react"`; `React.useState`.
- Named function exports (no default except pages); kebab-case filenames.
- `data-slot="..."` attributes on UI primitives; `cn()` from `@/lib/utils`.
- cva variants for component APIs; comments explain WHY, often `// --- Section ---` dividers.
- Dialogs: actions right-aligned in `DialogFooter`/`SheetFooter` inside `<form>`.
- Native `<Input type="date">` for dates (no calendar library).
- Buttons: size `sm`/`icon-sm`/`icon-xs` exist; ghost icon buttons use
  `size="icon"` + `title` + `<span className="sr-only">`.
- Popovers/menus: `render={<Button variant="outline"/>}` pattern (Base UI).

## 8. Feature: Advanced Filters Panel (implemented 2026-08-25)

- Entry: "Filters" button in customers toolbar (`AdvancedFiltersSheet`),
  shows active-filter count Badge; variant `secondary` when >0 active.
- State shape: `CustomerFilterState` in `lib/customer-filters.ts` —
  `{ status[], company[], dateFrom, dateTo, phone, email }` (empty = unset).
  `filterStateToParams()` converts to API params, omitting empties so query
  keys stay canonical. `countActiveFilters()` counts dimensions (max 6).
- Draft-then-apply: sheet edits a draft; "Apply filters" commits via
  `handleApplyFilters` (resets page to 1); "Clear all" commits empty
  immediately. Panel mounts ONLY while open → draft + saved filters
  initialize via `useState` initializers (no effects — lint rule).
- Templates (dynamic dates): Active customers / Recent contacts (last 30d) /
  Inactive leads. Saved custom filters persist in localStorage key
  `crm-dashboard.saved-filters`, shape-validated on read, best-effort.
- Companies come from `GET /api/customers/companies` (never hardcode).

## 9. Environment quirks / gotchas

- A dev server is often ALREADY RUNNING on :3000 (check before starting
  another; log: `.next/dev/logs/next-development.log`).
- `pnpm dev` warns about ignored `pnpm-workspace.yaml` (repo root is
  `my-app/`, git repo is `crm-dashboard/`) — harmless; fixable via
  `turbopack.root` in next.config.ts if it ever matters.
- AGENTS.md contains an auto-generated Next.js agent-rules block re-added by
  `next dev` — do not delete it; commit it with changes.
- Mock data resets on dev-server restart; IDs are `crypto.randomUUID()`.
- Windows/PowerShell environment; use `if ($?) { … }` for chaining, quote paths.
- HIT-AREA GOTCHA (caused a real bug): an `after:absolute after:-inset-*` extended
  hit-area on a component whose root is NOT `position: relative` resolves against
  the nearest positioned ancestor — inside a fixed drawer, one checkbox's
  invisible `::after` covered the whole panel and swallowed every click/scrollbar
  drag. Always pair `after:absolute` with `relative` on the element itself.
  Verified interactions headlessly with puppeteer-core + installed Chrome
  (scratch setup kept in `%TEMP%\opencode\uitest`).

## 10. Verification workflow (always run before finishing)

1. `npx tsc --noEmit`
2. `pnpm lint`
3. If dev server running: hit `http://localhost:3000/api/customers?…` with
   `Invoke-RestMethod` to verify API behavior; fetch `/customers` and check
   status 200 + no `__next_error__` marker.
