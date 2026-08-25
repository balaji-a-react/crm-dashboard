# CRM Dashboard — Project Context

> Purpose: give any developer or AI agent full working context in one read,
> so feature work can start immediately without re-exploring the codebase.
> Last updated: 2026-08-25 (after URL-state model, column reorder, logo,
> toast theming, loading-state pass).
>
> WORKING TREE NOTE: toast-color theming (globals.css/sonner.tsx/
> use-customer-row-actions.ts) and the loading-states pass (delete pending
> spinner, companies skeletons) are verified but deliberately UNCOMMITTED;
> app/customers/page.tsx also carries an unrelated manual edit (page-size
> default option 5→10). Don't sweep these into unrelated commits.

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
| Toasts      | `sonner` (`toast.success/error/warning`) | Per-type colors REQUIRE the `richColors` prop on `<Toaster>` — without it every type renders "normal" styling no matter what CSS vars you set. Type vars `--success/--error/--warning-{bg,text,border}` are set inline in `components/ui/sonner.tsx` from tokens in `globals.css` (light+dark). Deletion flows intentionally use `toast.error` (red), not success. |
| Icons        | `lucide-react` | |
| Pkg manager  | pnpm 10 | |

Installed but currently unused: `@tanstack/react-table` (table is hand-rolled), `@base-ui/react` combobox/autocomplete/toggle-group (no wrappers yet). `@dnd-kit/*` IS used (column reordering).

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
  page.tsx                    # "/" → redirect("/customers")
  icon.svg                    # favicon; same mark inlined as components/app-logo.tsx
  customers/page.tsx          # ★ MAIN PAGE: "use client"; ALL list state (search/filter/sort/page) derives from useSearchParams(); wrapped in <Suspense> (required for static prerender)
  api/customers/route.ts      # GET (filter+search+sort+paginate) + POST
  api/customers/[id]/route.ts # GET/PATCH/DELETE by id
  api/customers/companies/route.ts # GET distinct company names (for filter dropdown)
components/
  ui/                         # shadcn-style primitives (Base UI under the hood)
  customers/                  # feature components (table, cards, dialogs, detail DIALOG, filters sheet)
    customer-table.tsx        # dnd-kit column reorder + sortable headers + skeleton rows
    customer-detail-dialog.tsx# read-only detail MODAL (replaced the old side drawer)
    advanced-filters-sheet.tsx# controlled filters panel (no draft/Apply — real-time onChange)
  app-logo.tsx                # inline SVG logo (mirrors app/icon.svg); used in sidebar header
  app-sidebar.tsx, nav-main.tsx, header-breadcrumb.tsx, mode-toggle.tsx
hooks/
  use-customers.ts            # all TanStack Query hooks (lists, detail, mutations, useCompanies)
  use-customer-row-actions.ts # shared overlay state (+ isDeleting pending flag for delete confirm)
  use-mobile.ts
lib/
  types.ts                    # ★ domain contract — UI imports ONLY types from here
  mock-data.ts                # in-memory store: 150 deterministic customers, mutated by API routes
  api-client.ts               # typed fetch wrappers + query-string builder (arrays -> comma lists)
  customer-filters.ts         # filter state shape, templates, URL-param helpers, saved-filter persistence
  customer-schema.ts          # zod form schema + phone E.164 helpers (isValidPhone, limitPhoneNumber)
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

Overlays (detail Dialog, edit Dialog, delete AlertDialog) are rendered ONCE at
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

## 8. Feature: URL-param state model (customers page)

The URL is the SINGLE SOURCE OF TRUTH for list state: search (`q`), filters
(`status,company,dateFrom,dateTo,phone,email`), sort (`sortBy,sortOrder`),
pagination (`page,pageSize`). No useState for any of it — everything derives
from `useSearchParams()` via `searchParamsToFilters()` in
`lib/customer-filters.ts`; writes go through `updateURL()` (merge + `router.replace`,
filter/sort/search changes delete `page`). Multi-values are comma-joined.

Gotchas learned the hard way:
- Merging params by OBJECT SPREAD silently resurrects deleted values — the
  search-clear bug. Always mutate a `new URLSearchParams(prev)` copy with
  set/delete.
- Debounced search keeps `searchParams` in a ref synced via a no-deps effect;
  writing that ref during render violates `react-hooks/refs`.
- `useSearchParams()` in a client page REQUIRES a `<Suspense>` boundary or
  `next build` fails prerendering ("missing-suspense-with-csr-bailout") — dev
  never shows this; page.tsx wraps content in Suspense (spinner fallback).

## 9. Feature: Advanced Filters Panel

- Controlled component: props are `filters` + `onChange`; every toggle/keystroke
  commits to the URL immediately (no draft state, no Apply button). "Clear all"
  → `EMPTY_FILTER_STATE`. Sheet mounts only while open.
- Templates: Active customers / Recent contacts (last 30d) / Inactive leads.
  The template matching current filters renders `secondary` + check icon via
  `isSameFilterState()` (order-insensitive arrays, trimmed text).
- Saved custom filters persist in localStorage `crm-dashboard.saved-filters`
  (named presets — the only remaining localStorage filter data), shape-
  validated on read. Phone/email filter inputs run through `limitPhoneNumber`.
- Companies from `GET /api/customers/companies`; while loading the popover
  shows skeleton rows (never the empty-state message).

## 10. Feature: Table column reordering (dnd-kit)

`components/customers/customer-table.tsx`. Headers are sortable items
(handle-only grip so sort clicks keep working; PointerSensor distance 6,
KeyboardSensor for a11y); body cells re-render from the ordered descriptors
on drop. Actions column pinned last, outside SortableContext.

- Order persists in localStorage `crm-dashboard.customer-columns`, consumed
  through `useSyncExternalStore` with a module-level cached snapshot — NOT
  useState+effect (both hydration mismatch and `set-state-in-effect` landmines).
  getServerSnapshot returns the default order so SSR HTML always matches.
- HYDRATION GOTCHA: dnd-kit stamps handles with counter-based ARIA ids
  (`DndDescribedBy-N`) that advance per SSR request but reset per client —
  guaranteed attribute mismatch. Fix applied: grips render inert during
  SSR/hydration (identical span, no dnd attributes) via a useSyncExternalStore
  mount flag; dnd attributes attach post-mount. DndContext also gets a stable
  explicit `id`.

## 11. Validation & misc decisions

- Phone follows E.164: max **15 digits**, min 7; separators allowed but never
  counted. Enforced at THREE layers: zod (`customer-schema.ts`), live input
  cap (`limitPhoneNumber` via FormInputField's `transform` prop), and both API
  routes' `isValidPhone`. Leading `+` allowed only at position 0.
- Status badge capitalizes the label (`Active`/`Inactive`) — raw value stays lowercase.
- Detail view is a centred MODAL (`CustomerDetailDialog`, sm:max-w-md, footer
  actions), not a drawer; edit/delete still hand off to the shared page-level
  instances.
- Sidebar header shows `AppLogo` (inline SVG mirroring app/icon.svg);
  `size-8!` needed because SidebarMenuButton has a blanket `[&_svg]:size-4`.
- Loading states checklist: table/cards skeletons, detail & edit dialog
  skeletons, submit spinners, delete-confirm pending spinner + disabled,
  companies popover skeletons, Suspense fallback. placeholderData keeps the
  old table visible between filter/page fetches (no skeleton flash).

## 12. Environment quirks / gotchas

- A dev server is often ALREADY RUNNING on :3000 (check before starting
  another; log: `.next/dev/logs/next-development.log`).
- `pnpm dev` warns about ignored `pnpm-workspace.yaml` (repo root is
  `my-app/`, git repo is `crm-dashboard/`) — harmless; fixable via
  `turbopack.root` in next.config.ts if it ever matters.
- AGENTS.md contains an auto-generated Next.js agent-rules block re-added by
  `next dev` — do not delete it; commit it with changes.
- Mock data resets on dev-server restart; IDs are `crypto.randomUUID()`.
- Windows/PowerShell environment; use `if ($?) { … }` for chaining, quote
  paths. Inline `node -e "…"` gets mangled by PS quoting — always write test
  scripts to files.
- HIT-AREA GOTCHA (caused a real bug): an `after:absolute after:-inset-*`
  extended hit-area on a component whose root is NOT `position: relative`
  resolves against the nearest positioned ancestor — inside a fixed drawer,
  one checkbox's invisible `::after` covered the whole panel and swallowed
  every click/scrollbar drag. Always pair `after:absolute` with `relative`.
- LINT ESCAPE HATCH for legitimate mount-time client-only values: prefer
  `useSyncExternalStore(noopSubscribe, () => true, () => false)` over
  setState-in-effect hacks. Used twice: localStorage column order and the
  dnd-kit grip mount gate.
- Headless verification: puppeteer-core + installed Chrome, scratch setup in
  `%TEMP%\opencode\uitest` (many reusable suites: url-params, column-order,
  phone-cap, toast-colors, loading-states...). For slow-state UI tests use
  `page.setRequestInterception(true)` + delayed `continue()` per URL pattern;
  remember throttling also hits refetches when asserting completion timing.

## 13. Verification workflow (always run before finishing)

1. `npx tsc --noEmit`
2. `pnpm lint`
3. If dev server running: hit `http://localhost:3000/api/customers?…` with
   `Invoke-RestMethod` to verify API behavior; fetch `/customers` and check
   status 200 + no `__next_error__` marker.
4. If routing/data-fetching surfaces changed: `pnpm build` — prerender errors
   (Suspense/csr-bailout) only appear here, never in dev.
