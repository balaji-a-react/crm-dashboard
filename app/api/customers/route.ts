import {
  addCustomer,
  getCustomers,
} from "@/lib/mock-data";
import type { Customer, CustomerListParams } from "@/lib/types";

// ---------------------------------------------------------------------------
// Tiny validation helpers (intentionally dependency-free)
// ---------------------------------------------------------------------------

function isValidEmail(email: string): boolean {
  // Deliberately simple: something@something.tld
  return /^\S+@\S+\.\S+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  // Accepts digits, spaces, parens, +, - and . with a minimum length.
  return /^[\d\s()+.-]{7,}$/.test(phone);
}

/** Parses a comma-separated query param into a lowercased string array. */
function parseList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

function clampInt(value: string | null, fallback: number, min: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed) || parsed < min) return fallback;
  return parsed;
}

// ---------------------------------------------------------------------------
// GET /api/customers -- filter + search + sort + paginate
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Whitelisted sort field -> anything unexpected falls back to "name".
  const sortByParam = searchParams.get("sortBy");
  const sortBy: NonNullable<CustomerListParams["sortBy"]> =
    sortByParam === "email" || sortByParam === "lastContactDate"
      ? sortByParam
      : "name";
  const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc";
  const page = clampInt(searchParams.get("page"), 1, 1);
  const pageSize = clampInt(searchParams.get("pageSize"), 10, 1);

  const search = searchParams.get("search")?.trim().toLowerCase() || undefined;
  const statuses = parseList(searchParams.get("status"));
  const companies = parseList(searchParams.get("company"));
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;
  const phone = searchParams.get("phone")?.trim() || undefined;
  const email = searchParams.get("email")?.trim().toLowerCase() || undefined;

  // 1) FILTER -- always on the full dataset, producing a fresh array so the
  //    in-place sort below never mutates the mock store itself.
  let result = getCustomers().filter((c) => {
    if (
      search &&
      !c.name.toLowerCase().includes(search) &&
      !c.email.toLowerCase().includes(search) &&
      !c.company.toLowerCase().includes(search)
    ) {
      return false;
    }
    if (statuses.length > 0 && !statuses.includes(c.status)) {
      return false;
    }
    const companyLower = c.company.toLowerCase();
    if (companies.length > 0 && !companies.includes(companyLower)) {
      return false;
    }
    // ISO dates (YYYY-MM-DD) compare correctly as plain strings.
    if (dateFrom && c.lastContactDate < dateFrom) return false;
    if (dateTo && c.lastContactDate > dateTo) return false;
    if (
      phone &&
      !c.phone.replace(/\D/g, "").includes(phone.replace(/\D/g, ""))
    ) {
      return false;
    }
    if (email && !c.email.toLowerCase().includes(email)) {
      return false;
    }
    return true;
  });

  // 2) SORT
  const direction = sortOrder === "desc" ? -1 : 1;
  result = result.sort(
    (a, b) => a[sortBy].localeCompare(b[sortBy]) * direction
  );

  // 3) PAGINATE -- total is computed BEFORE slicing so clients can build pages.
  const total = result.length;
  const start = (page - 1) * pageSize;
  const data: Customer[] = result.slice(start, start + pageSize);

  return Response.json({ data, total, page, pageSize });
}

// ---------------------------------------------------------------------------
// POST /api/customers -- create
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!name || !email || !phone) {
    return Response.json(
      { error: "Fields 'name', 'email' and 'phone' are required." },
      { status: 400 }
    );
  }
  if (!isValidEmail(email)) {
    return Response.json({ error: "Invalid email address." }, { status: 400 });
  }
  if (!isValidPhone(phone)) {
    return Response.json({ error: "Invalid phone number." }, { status: 400 });
  }

  const customer = addCustomer({
    name,
    email,
    phone,
    company: typeof body.company === "string" ? body.company.trim() : "",
    status: body.status === "inactive" ? "inactive" : "active",
    lastContactDate:
      typeof body.lastContactDate === "string"
        ? body.lastContactDate
        : new Date().toISOString().slice(0, 10),
    notes: typeof body.notes === "string" ? body.notes : undefined,
  });

  return Response.json(customer, { status: 201 });
}
