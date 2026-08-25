import type { CustomerListParams, CustomerStatus } from "./types";

// ---------------------------------------------------------------------------
// Filter state (UI-side shape)
//
// The panel works with a "total" state object where empty means "not set":
// empty arrays for multi-selects, "" for text/date inputs. Only non-empty
// values are converted into API params, so an untouched panel sends nothing.
// ---------------------------------------------------------------------------

export interface CustomerFilterState {
  /** [] = any status */
  status: CustomerStatus[];
  /** [] = any company */
  company: string[];
  /** ISO date (YYYY-MM-DD) or "" -- inclusive lower bound on lastContactDate */
  dateFrom: string;
  /** ISO date (YYYY-MM-DD) or "" -- inclusive upper bound on lastContactDate */
  dateTo: string;
  /** "" = unset -- partial match on digits */
  phone: string;
  /** "" = unset -- partial, case-insensitive match */
  email: string;
}

export const EMPTY_FILTER_STATE: CustomerFilterState = {
  status: [],
  company: [],
  dateFrom: "",
  dateTo: "",
  phone: "",
  email: "",
};

export function isEmptyFilterState(state: CustomerFilterState): boolean {
  return countActiveFilters(state) === 0;
}

/**
 * Dimension-wise equality between two filter states. Arrays compare as sets
 * (order-insensitive) and text fields are trimmed, so states that would
 * produce identical API params are considered equal.
 */
export function isSameFilterState(
  a: CustomerFilterState,
  b: CustomerFilterState
): boolean {
  const setKey = (values: string[]) => [...values].sort().join("\u0000");
  return (
    setKey(a.status) === setKey(b.status) &&
    setKey(a.company) === setKey(b.company) &&
    a.dateFrom === b.dateFrom &&
    a.dateTo === b.dateTo &&
    a.phone.trim() === b.phone.trim() &&
    a.email.trim() === b.email.trim()
  );
}

/**
 * Number of filter DIMENSIONS currently set (max 6). A dimension counts once
 * regardless of how many values it holds -- e.g. 3 companies ticked is still
 * one "Company" filter. This is what the active-filters badge shows.
 */
export function countActiveFilters(state: CustomerFilterState): number {
  let count = 0;
  if (state.status.length > 0) count += 1;
  if (state.company.length > 0) count += 1;
  if (state.dateFrom) count += 1;
  if (state.dateTo) count += 1;
  if (state.phone.trim()) count += 1;
  if (state.email.trim()) count += 1;
  return count;
}

/**
 * Filter state -> the subset of CustomerListParams the API understands.
 * Unset dimensions are omitted entirely so query keys stay canonical
 * (two "equal" filter states produce the exact same params object shape).
 */
export function filterStateToParams(
  state: CustomerFilterState
): Pick<
  CustomerListParams,
  "status" | "company" | "dateFrom" | "dateTo" | "phone" | "email"
> {
  const params: ReturnType<typeof filterStateToParams> = {};
  if (state.status.length > 0) params.status = state.status;
  if (state.company.length > 0) params.company = state.company;
  if (state.dateFrom) params.dateFrom = state.dateFrom;
  if (state.dateTo) params.dateTo = state.dateTo;
  const phone = state.phone.trim();
  if (phone) params.phone = phone;
  const email = state.email.trim();
  if (email) params.email = email;
  return params;
}

// ---------------------------------------------------------------------------
// URL search-param helpers
//
// Filters + sort + pagination are stored in the URL as search params so they
// survive navigation and refresh.  The helpers below convert between the
// CustomerFilterState shape the panel uses and flat URLSearchParams.
// ---------------------------------------------------------------------------

const VALID_SORT_FIELDS = new Set<string>(["name", "email", "lastContactDate"]);

/**
 * Parse URL search params into the full filter/sort/page state the page needs.
 * Invalid or missing values silently fall back to defaults.
 */
export function searchParamsToFilters(sp: URLSearchParams) {
  const status = (sp.get("status") ?? "")
    .split(",")
    .filter(Boolean) as CustomerStatus[];
  const company = sp.get("company")?.split(",").filter(Boolean) ?? [];

  const sortByRaw = sp.get("sortBy");
  const sortBy: NonNullable<CustomerListParams["sortBy"]> =
    sortByRaw && VALID_SORT_FIELDS.has(sortByRaw)
      ? (sortByRaw as NonNullable<CustomerListParams["sortBy"]>)
      : "name";
  const sortOrder: "asc" | "desc" =
    sp.get("sortOrder") === "desc" ? "desc" : "asc";

  return {
    filters: {
      status,
      company,
      dateFrom: sp.get("dateFrom") ?? "",
      dateTo: sp.get("dateTo") ?? "",
      phone: sp.get("phone") ?? "",
      email: sp.get("email") ?? "",
    } as CustomerFilterState,
    search: sp.get("q") ?? "",
    sortBy,
    sortOrder,
    page: Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1),
    pageSize: Math.max(1, parseInt(sp.get("pageSize") ?? "10", 10) || 10),
  };
}

/**
 * Convert a CustomerFilterState into a flat Record<string, string | null>
 * suitable for merging into URL search params.  Empty arrays / strings
 * produce `null` (delete) so they don't clutter the URL.
 */
export function filtersToParamUpdates(
  state: CustomerFilterState
): Record<string, string | null> {
  return {
    status: state.status.length > 0 ? state.status.join(",") : null,
    company: state.company.length > 0 ? state.company.join(",") : null,
    dateFrom: state.dateFrom || null,
    dateTo: state.dateTo || null,
    phone: state.phone.trim() || null,
    email: state.email.trim() || null,
  };
}

// ---------------------------------------------------------------------------
// Pre-built templates
//
// `build` is a function (not a static object) so relative dates like
// "last 30 days" are computed at the moment the template is applied.
// ---------------------------------------------------------------------------

/** Returns today minus `days` as YYYY-MM-DD (matches the API's date format). */
function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export interface FilterTemplate {
  id: string;
  label: string;
  description: string;
  build: () => CustomerFilterState;
}

export const FILTER_TEMPLATES: FilterTemplate[] = [
  {
    id: "active-customers",
    label: "Active customers",
    description: "Status is active",
    build: () => ({ ...EMPTY_FILTER_STATE, status: ["active"] }),
  },
  {
    id: "recent-contacts",
    label: "Recent contacts",
    description: "Contacted in the last 30 days",
    build: () => ({ ...EMPTY_FILTER_STATE, dateFrom: isoDaysAgo(30) }),
  },
  {
    id: "inactive-leads",
    label: "Inactive leads",
    description: "Status is inactive",
    build: () => ({ ...EMPTY_FILTER_STATE, status: ["inactive"] }),
  },
];

// ---------------------------------------------------------------------------
// Saved custom filters (localStorage)
//
// Named filter combinations the user explicitly saves. Best-effort: readers
// validate shape defensively so a corrupted or outdated payload degrades to
// an empty list instead of crashing the page.
// ---------------------------------------------------------------------------

const SAVED_FILTERS_KEY = "crm-dashboard.saved-filters";

export interface SavedFilter {
  id: string;
  name: string;
  state: CustomerFilterState;
}

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full / disabled -- persistence is a nicety, never a failure.
  }
}

function isCustomerFilterState(value: unknown): value is CustomerFilterState {
  if (typeof value !== "object" || value === null) return false;
  const state = value as Record<string, unknown>;
  return (
    Array.isArray(state.status) &&
    Array.isArray(state.company) &&
    typeof state.dateFrom === "string" &&
    typeof state.dateTo === "string" &&
    typeof state.phone === "string" &&
    typeof state.email === "string"
  );
}

export function readSavedFilters(): SavedFilter[] {
  const saved = readJson<SavedFilter[]>(SAVED_FILTERS_KEY);
  if (!Array.isArray(saved)) return [];
  // Drop entries that no longer match the expected shape (e.g. after a
  // schema change) so one bad record can't break the whole list.
  return saved.filter(
    (entry) =>
      typeof entry?.id === "string" &&
      typeof entry?.name === "string" &&
      isCustomerFilterState(entry?.state)
  );
}

export function writeSavedFilters(filters: SavedFilter[]): void {
  writeJson(SAVED_FILTERS_KEY, filters);
}
