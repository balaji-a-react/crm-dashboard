import { getCustomers } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// GET /api/customers/companies -- distinct company names for filter dropdowns
//
// Derived from the store (not hardcoded in the UI) so the dropdown always
// reflects the data that actually exists, including companies added later
// via POST.
// ---------------------------------------------------------------------------

export async function GET() {
  const companies = [
    ...new Set(getCustomers().map((c) => c.company)),
  ].sort((a, b) => a.localeCompare(b));

  return Response.json({ companies });
}
