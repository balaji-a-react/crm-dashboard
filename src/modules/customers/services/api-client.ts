import type {
  Customer,
  CustomerListParams,
  CustomersResponse,
  NewCustomer,
  CustomerUpdates,
} from "@/modules/customers/types/customer";

const API_BASE = "/api/customers";

// ---------------------------------------------------------------------------
// Shared fetch wrapper: throws on non-ok so TanStack Query treats every
// error response as an actual error (query.error) instead of bad data.
// ---------------------------------------------------------------------------

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);

  if (!res.ok) {
    // Prefer the API's JSON error message, fall back to the status text.
    let message = res.statusText || `Request failed with ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // Response had no JSON body -- keep the fallback message.
    }
    throw new Error(message);
  }

  // DELETE returns 204 No Content -- nothing to parse.
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Filter params -> query string
//
// Mapping rules:
// - null/undefined/"" values are skipped entirely (no empty params sent)
// - arrays become comma-separated lists: ?status=active,inactive
//   (the GET handler splits them back via parseList)
// - numbers are stringified by URLSearchParams automatically
// ---------------------------------------------------------------------------

function buildQueryString(params: CustomerListParams): string {
  const searchParams = new URLSearchParams();

  const simpleEntries: [string, string | undefined][] = [
    ["search", params.search],
    ["dateFrom", params.dateFrom],
    ["dateTo", params.dateTo],
    ["phone", params.phone],
    ["email", params.email],
    ["sortBy", params.sortBy],
    ["sortOrder", params.sortOrder],
    ["page", params.page?.toString()],
    ["pageSize", params.pageSize?.toString()],
  ];

  for (const [key, value] of simpleEntries) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, value);
    }
  }

  for (const listKey of ["status", "company"] as const) {
    const list = params[listKey];
    if (list && list.length > 0) {
      searchParams.set(listKey, list.join(","));
    }
  }

  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

// ---------------------------------------------------------------------------
// Typed endpoint wrappers
// ---------------------------------------------------------------------------

export function fetchCustomers(
  params: CustomerListParams = {}
): Promise<CustomersResponse> {
  return request<CustomersResponse>(`${API_BASE}${buildQueryString(params)}`);
}

export function fetchCustomer(id: string): Promise<Customer> {
  return request<Customer>(`${API_BASE}/${id}`);
}

export async function fetchCompanies(): Promise<string[]> {
  const body = await request<{ companies: string[] }>(
    `${API_BASE}/companies`
  );
  return body.companies;
}

export function createCustomer(data: NewCustomer): Promise<Customer> {
  return request<Customer>(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function updateCustomer(
  id: string,
  data: CustomerUpdates
): Promise<Customer> {
  return request<Customer>(`${API_BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  await request<void>(`${API_BASE}/${id}`, { method: "DELETE" });
}
