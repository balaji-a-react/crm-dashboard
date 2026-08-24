import {
  CustomerRowActions,
  CustomerStatusBadge,
  formatLastContactDate,
} from "@/components/customers/shared"
import { Skeleton } from "@/components/ui/skeleton"
import type { Customer } from "@/lib/types"

export function CustomerCard({ customer }: { customer: Customer }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
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
        <CustomerRowActions />
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
}: {
  isLoading: boolean
  isError: boolean
  error: Error | null
  customers?: Customer[]
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
          <CustomerCard key={customer.id} customer={customer} />
        ))}
    </div>
  )
}
