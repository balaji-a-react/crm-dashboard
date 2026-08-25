# CRM Dashboard

A customer management dashboard with search, advanced filtering, and full CRUD — built for the Front-End Developer take-home task.

**Live demo:** https://crm-dashboard-five-mu.vercel.app/customers
**Repo:** https://github.com/balaji-a-react/crm-dashboard

---

## Tech Stack

- **Next.js** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** components
- **TanStack Query** for data fetching & caching
- **dnd-kit** for drag and drop

---

## Features

### 1. Customer List View
- Table (desktop) / card (mobile) layout, fully responsive
- Name, Email, Phone, Company, Status, Last Contact columns
- Real-time search by name, email, or company
- Sortable columns
- Pagination — 10 / 25 / 50 per page

### 2. Advanced Filters Panel
- Status — checkboxes
- Company — multi-select
- Last contact — date range
- Phone & Email — partial match
- Save custom filter combinations
- Pre-built templates — Active Customers, Recent Contacts, Inactive Leads
- Clear all filters
- Live active-filter count badge
- Filters apply in real time and combine with search — all via URL, so it survives refresh and is shareable

### 3. Customer Details & Management
- Click a row to view full details in a modal
- Add / edit with inline validation
- Delete with confirmation dialog
- Notes field, last-contact-date field

### 4. Data Fetching
- TanStack Query throughout — caching, loading & error states
- Auto-refetch after every add/edit/delete

### 5. Form Validation & Feedback
- zod schema validation (client + API)
- Inline field errors
- Success/error toasts on every action
- Buttons disable during submission

### 6. Drag & Drop
- **Column reordering** on the customers table (dnd-kit), persisted across refresh
- *Note: the spec's examples were row-based (reorder customers / move between groups / reorder saved filters). Column reordering was chosen instead as the better fit for the existing table — happy to add row reordering too if preferred.*

---

## Assumptions

- **Mock data**, no real database — resets on server restart, and may not persist reliably across serverless invocations on Vercel. API routes are structured so a real DB drops in cleanly.
- **No dashboard page** — the task mockups showed one, but it wasn't in the written requirements, so effort went into the Customers feature. `/` redirects straight to `/customers`.
- **Filters apply live**, no separate "Apply" button (spec allows either).

## Not implemented (nice-to-haves)
- Bulk actions
- CSV export
- Keyboard shortcuts
- Optimistic updates

---

## Running locally

```bash
pnpm install
pnpm dev        # http://localhost:3000
```