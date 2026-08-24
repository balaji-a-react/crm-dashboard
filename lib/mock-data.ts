import type { Customer, NewCustomer } from "./types";

/**
 * In-memory mock store.
 *
 * - `customers` is deliberately a module-level `let` array so the
 *   POST/PATCH/DELETE handlers can mutate it during development.
 * - Everything resets when the dev server restarts -- acceptable for now;
 *   this module is the single swap point for a real database later.
 */

// ---------------------------------------------------------------------------
// Deterministic fake-data generation (index-based, no RNG -> stable output)
// ---------------------------------------------------------------------------

const FIRST_NAMES = [
  "Olivia", "Marcus", "Sofia", "Liam", "Ava", "Noah", "Emma", "Jackson",
  "Mia", "Lucas", "Isabella", "Ethan", "Amara", "Felix", "Priya", "Diego",
  "Hannah", "Yusuf", "Freya", "Andre",
];

const LAST_NAMES = [
  "Bennett", "Chen", "Ramirez", "O'Connor", "Thompson", "Kim", "Fischer",
  "Wright", "Novak", "Silva",
];

const COMPANIES = [
  { name: "Acme Corp", domain: "acme.io" },
  { name: "Globex Industries", domain: "globex.com" },
  { name: "Initech Systems", domain: "initech.dev" },
  { name: "BlueSky Media", domain: "bluesky.media" },
  { name: "Northwind Traders", domain: "northwind.co" },
];

/** Formats a Date as YYYY-MM-DD so ISO string comparison works in filters. */
function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Returns today minus `days`. */
function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function generateCustomers(count: number): Customer[] {
  const list: Customer[] = [];

  for (let i = 0; i < count; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
    const company = COMPANIES[i % COMPANIES.length];

    // Append the index when the first/last combination repeats so
    // every email stays unique even with only 200 possible name pairs.
    const comboIndex = Math.floor(i / (FIRST_NAMES.length * LAST_NAMES.length));
    const email = comboIndex
      ? `${first}.${last}${comboIndex + 1}@${company.domain}`.toLowerCase()
      : `${first}.${last}@${company.domain}`.toLowerCase();

    // Spread last contact evenly across the last ~12 months:
    // i*37 % 365 produces a repeating-but-scattered day offset per record.
    const lastContactDays = (i * 37) % 365;
    // createdAt is always older than lastContactDate.
    const createdDays = 365 + ((i * 53) % 400);

    list.push({
      id: String(i + 1),
      name: `${first} ${last}`,
      email,
      phone: `+1 (${300 + (i % 600)}) ${String(100 + ((i * 7) % 900)).padStart(3, "0")}-${String(1000 + ((i * 137) % 9000)).padStart(4, "0")}`,
      company: company.name,
      // ~2/3 active, ~1/3 inactive for a realistic status mix.
      status: i % 3 === 0 ? "inactive" : "active",
      lastContactDate: toISODate(daysAgo(lastContactDays)),
      notes: i % 10 === 0 ? "Follow up next quarter." : undefined,
      createdAt: toISODate(daysAgo(createdDays)),
    });
  }

  return list;
}

// ---------------------------------------------------------------------------
// Mutable store + CRUD helpers used by the route handlers
// ---------------------------------------------------------------------------

let customers: Customer[] = generateCustomers(150);

export function getCustomers(): Customer[] {
  return customers;
}

export function getCustomerById(id: string): Customer | undefined {
  return customers.find((c) => c.id === id);
}

export function addCustomer(data: NewCustomer): Customer {
  const customer: Customer = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: toISODate(new Date()),
  };
  customers.push(customer);
  return customer;
}

export function updateCustomer(
  id: string,
  data: Partial<NewCustomer>
): Customer | undefined {
  const index = customers.findIndex((c) => c.id === id);
  if (index === -1) return undefined;

  customers[index] = { ...customers[index], ...data };
  return customers[index];
}

export function deleteCustomer(id: string): boolean {
  const before = customers.length;
  customers = customers.filter((c) => c.id !== id);
  return customers.length < before;
}
