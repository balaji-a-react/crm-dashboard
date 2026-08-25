"use client"

import * as React from "react"
import { PencilIcon, Trash2Icon } from "lucide-react"

import { CustomerStatusBadge } from "@/modules/customers/components/Shared"
import { Button } from "@/components/ui/Button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog"
import { Skeleton } from "@/components/ui/Skeleton"
import { useCustomer } from "@/modules/customers/hooks/use-customers"

export interface CustomerDetailDialogProps {
  /** Which customer to load; null renders nothing meaningful but keeps the
   * dialog mounted for exit animations. */
  customerId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Editing lives in the shared edit dialog (same modal as Add) rendered
   * once at page level -- this dialog only hands off the id. */
  onEditRequest: (id: string) => void
  /** Routed to the SINGLE page-level delete confirmation -- this dialog
   * never owns its own dialog. */
  onDeleteRequest: (id: string) => void
}

/** One labelled read-only field row in view mode. */
function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b py-2 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm wrap-break-word">{value ?? "—"}</span>
    </div>
  )
}

/**
 * Read-only detail view as a centred modal (replaces the old side drawer).
 * Editing is NOT done here -- the Edit button routes to the page-level
 * EditCustomerDialog (same form modal as Add), and Delete hands off to the
 * shared page-level confirmation, so both flows stay identical on mobile
 * and desktop.
 */
export function CustomerDetailDialog({
  customerId,
  open,
  onOpenChange,
  onEditRequest,
  onDeleteRequest,
}: CustomerDetailDialogProps) {
  const { data: customer, isLoading } = useCustomer(customerId ?? undefined)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 sm:max-w-md">
        <DialogHeader className="gap-1 pr-8 pb-3 border-b">
          <DialogTitle>{customer?.name ?? "Customer"}</DialogTitle>
          <DialogDescription>
            {customer?.company || "Customer details"}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto pt-2 pr-1">
          {isLoading && (
            <div className="flex flex-col gap-3 py-2">
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

        {/* Edit hands off to the shared dialog; Delete hands off to the
            shared confirmation dialog at page level */}
        {customer && (
          <DialogFooter>
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
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
