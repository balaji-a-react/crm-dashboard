import {
  CustomerRowActions,
  CustomerStatusBadge,
  formatLastContactDate,
} from "@/components/customers/shared"
import type { Customer } from "@/lib/customers/types"

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
          Last contact{" "}
          {formatLastContactDate(customer.lastContactDate)}
        </span>
        <CustomerRowActions />
      </div>
    </div>
  )
}

export function CustomerCards({ customers }: { customers: Customer[] }) {
  return (
    <div className="flex flex-col gap-3">
      {customers.map((customer) => (
        <CustomerCard key={customer.id} customer={customer} />
      ))}
    </div>
  )
}
