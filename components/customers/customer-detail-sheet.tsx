"use client"

import * as React from "react"
import { PencilIcon, Trash2Icon } from "lucide-react"

import { CustomerStatusBadge } from "@/components/customers/shared"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { useCustomer } from "@/hooks/use-customers"

export interface CustomerDetailSheetProps {
  /** Which customer to load; null renders nothing meaningful but keeps the
   * sheet mounted for exit animations. */
  customerId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Editing lives in the shared edit dialog (same modal as Add) rendered
   * once at page level -- this sheet only hands off the id. */
  onEditRequest: (id: string) => void
  /** Routed to the SINGLE page-level delete confirmation -- this sheet
   * never owns its own dialog. */
  onDeleteRequest: (id: string) => void
}

/** One labelled read-only field row in view mode. */
function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b py-2 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm break-words">{value ?? "—"}</span>
    </div>
  )
}

/**
 * Read-only detail view. Editing is NOT done here anymore -- the Edit button
 * routes to the page-level EditCustomerDialog (same form modal as Add), so
 * both flows stay identical on mobile and desktop.
 */
export function CustomerDetailSheet({
  customerId,
  open,
  onOpenChange,
  onEditRequest,
  onDeleteRequest,
}: CustomerDetailSheetProps) {
  const { data: customer, isLoading } = useCustomer(customerId ?? undefined)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* side="right" only; width comes from the Sheet's own responsive
          defaults (full-width drawer on mobile, panel on desktop). */}
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader className="pr-12">
          <SheetTitle>{customer?.name ?? "Customer"}</SheetTitle>
          <SheetDescription>
            {customer?.company || "Customer details"}
          </SheetDescription>

          {/* Edit hands off to the shared dialog; Delete hands off to the
              shared confirmation dialog at page level */}
          {customer && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onEditRequest(customer.id)}>
                <PencilIcon />
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDeleteRequest(customer.id)}
              >
                <Trash2Icon />
                Delete
              </Button>
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {isLoading && (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}

          {!isLoading && !customer && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Customer not found.
            </p>
          )}

          {customer && (
            <div className="flex flex-col">
              <DetailRow label="Name" value={customer.name} />
              <DetailRow label="Email" value={customer.email} />
              <DetailRow label="Phone" value={customer.phone} />
              <DetailRow label="Company" value={customer.company} />
              <DetailRow
                label="Status"
                value={<CustomerStatusBadge status={customer.status} />}
              />
              <DetailRow
                label="Last contact"
                value={new Intl.DateTimeFormat("en-US", {
                  dateStyle: "medium",
                  timeZone: "UTC",
                }).format(new Date(customer.lastContactDate))}
              />
              <DetailRow
                label="Created"
                value={new Intl.DateTimeFormat("en-US", {
                  dateStyle: "medium",
                  timeZone: "UTC",
                }).format(new Date(customer.createdAt))}
              />
              <DetailRow label="Notes" value={customer.notes} />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
