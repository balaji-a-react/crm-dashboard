import {
  CustomerRowActions,
  CustomerStatusBadge,
  formatLastContactDate,
} from "@/components/customers/shared"
import { Skeleton } from "@/components/ui/skeleton"
import type {
  Customer,
} from "@/lib/types"
import type { CustomerViewActions } from "@/components/customers/customer-table"

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
 */
export function CustomerCardsSection({
  isLoading,
  isError,
  error,
  customers,
  actions,
}: {
  isLoading: boolean
  isError: boolean
  error: Error | null
  customers?: Customer[]
  actions: CustomerViewActions
}) {
  return (
    <div className="flex flex-col gap-3">
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
