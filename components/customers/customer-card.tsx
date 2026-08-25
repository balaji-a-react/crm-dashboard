import {
  ArrowDownIcon,
  ArrowUpIcon,
} from "lucide-react"

import {
  CustomerRowActions,
  CustomerStatusBadge,
  formatLastContactDate,
} from "@/components/customers/shared"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type {
  Customer,
} from "@/lib/types"
import type {
  CustomerSortState,
  CustomerViewActions,
} from "@/components/customers/customer-table"

/** Sortable fields mirror the API's sortBy union -- keep labels short for mobile. */
const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "lastContactDate", label: "Last Contact" },
] satisfies { value: CustomerSortState["field"]; label: string }[]

export function CustomerCard({
  customer,
  actions,
}: {
  customer: Customer
  actions: CustomerViewActions
}) {
  return (
    // Card click opens the detail sheet (view mode) -- same as table rows
    <div
      role="button"
      tabIndex={0}
      className="flex cursor-pointer flex-col gap-3 rounded-lg border p-4 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      onClick={() => actions.onOpenDetail(customer.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          actions.onOpenDetail(customer.id)
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{customer.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {customer.company}
          </p>
        </div>
        <CustomerStatusBadge status={customer.status} />
      </div>
      <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
        <span className="truncate">{customer.email}</span>
        <span>{customer.phone}</span>
      </div>
      <div className="flex items-center justify-between border-t pt-3">
        <span className="text-xs text-muted-foreground">
          Last contact {formatLastContactDate(customer.lastContactDate)}
        </span>
        {/* Buttons stopPropagation internally, so this won't re-trigger the
            card's openDetail */}
        <CustomerRowActions
          onEdit={() => actions.onOpenEdit(customer.id)}
          onDelete={() => actions.onDeleteRequest(customer.id)}
        />
      </div>
    </div>
  )
}

/**
 * Mobile (<=md) presentation of the customer list with its own
 * loading/error/empty states, mirroring the desktop table section.
 * The table sorts via clickable headers; here a compact field select +
 * direction toggle drive the SAME URL params, so both views stay in sync.
 */
export function CustomerCardsSection({
  isLoading,
  isError,
  error,
  customers,
  sort,
  actions,
}: {
  isLoading: boolean
  isError: boolean
  error: Error | null
  customers?: Customer[]
  sort?: CustomerSortState
  actions: CustomerViewActions
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* Mobile sort bar: same sortBy/sortOrder state the table headers use.
          onSort(field) sets asc on a new field; onSort(current) flips order. */}
      {sort && (
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm text-muted-foreground">
            Sort by
          </span>
          {/* items makes SelectValue show the label ("Name") instead of the
              raw stored value ("name") -- same pattern as FormSelectField. */}
          <Select
            value={sort.field}
            items={SORT_OPTIONS}
            onValueChange={(value) => sort.onSort(value as CustomerSortState["field"])}
          >
            <SelectTrigger className="flex-1" aria-label="Sort customers by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon-sm"
            title={
              sort.order === "asc"
                ? "Ascending -- tap for descending"
                : "Descending -- tap for ascending"
            }
            onClick={() => sort.onSort(sort.field)}
          >
            {sort.order === "asc" ? (
              <ArrowUpIcon />
            ) : (
              <ArrowDownIcon />
            )}
            <span className="sr-only">
              Sort {sort.order === "asc" ? "ascending" : "descending"}
            </span>
          </Button>
        </div>
      )}

      {/* Fewer skeleton cards than table rows: keeps mobile scroll sane */}
      {isLoading &&
        Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={`card-skeleton-${i}`} className="h-28 rounded-lg" />
        ))}

      {isError && (
        <div className="rounded-lg border p-8 text-center text-sm text-destructive">
          Failed to load customers: {error?.message}
        </div>
      )}

      {!isLoading && !isError && (customers?.length ?? 0) === 0 && (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          No customers found
        </div>
      )}

      {!isLoading &&
        !isError &&
        customers?.map((customer) => (
          <CustomerCard key={customer.id} customer={customer} actions={actions} />
        ))}
    </div>
  )
}
