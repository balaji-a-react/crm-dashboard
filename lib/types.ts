// Domain contract shared by the UI, the API layer, and the mock store.
// The UI must only ever import types from here -- it should not know
// whether data comes from the mock store or a real database.

export type CustomerStatus = "active" | "inactive";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: CustomerStatus;
  /** ISO date string (YYYY-MM-DD) */
  lastContactDate: string;
  notes?: string;
  /** ISO date string (YYYY-MM-DD) */
  createdAt: string;
}

/** Payload for creating a customer -- server owns `id` and `createdAt`. */
export type NewCustomer = Omit<Customer, "id" | "createdAt">;

/** Payload for a partial update -- every field is optional. */
export type CustomerUpdates = Partial<NewCustomer>;

/**
 * Shape returned by GET /api/customers.
 * `total` is the count AFTER filtering but BEFORE pagination,
 * so the UI can compute the page count.
 */
export interface CustomersResponse {
  data: Customer[];
  total: number;
  page: number;
  pageSize: number;
}

/** All list-endpoint query/filter/sort parameters in one typed bag. */
export interface CustomerListParams {
  search?: string;
  status?: string[]; // e.g. ["active", "inactive"]
  company?: string[];
  dateFrom?: string;
  dateTo?: string;
  phone?: string;
  email?: string;
  sortBy?: "name" | "email" | "lastContactDate";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}
