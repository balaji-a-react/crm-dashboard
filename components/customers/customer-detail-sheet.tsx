"use client"

import * as React from "react"
import { PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { CustomerForm } from "@/components/customers/customer-form"
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
import { useCustomer, useUpdateCustomer } from "@/hooks/use-customers"

export interface CustomerDetailSheetProps {
  /** Which customer to load; null renders nothing meaningful but keeps the
   * sheet mounted for exit animations. */
  customerId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  initialMode?: "view" | "edit"
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

export function CustomerDetailSheet({
  customerId,
  open,
  onOpenChange,
  initialMode = "view",
  onDeleteRequest,
}: CustomerDetailSheetProps) {
  // Mode is local per the spec. The page remounts this component with a
  // `key` of (customerId + mode), which guarantees `initialMode` re-runs on
  // every open and the state effectively resets when the sheet closes --
  // without needing setState inside an effect.
  const [mode, setMode] = React.useState<"view" | "edit">(initialMode)

  const { data: customer, isLoading } = useCustomer(customerId ?? undefined)
  const updateMutation = useUpdateCustomer()

  /**
   * Single close funnel: user dismissals (ESC/backdrop/X via onOpenChange)
   * and programmatic closes all land here, so the next open starts in
   * view mode.
   */
  function handleClose() {
    setMode("view")
    onOpenChange(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : handleClose())}
    >
      {/* side="right" only; width comes from the Sheet's own responsive
          defaults (full-width drawer on mobile, panel on desktop). */}
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader className="pr-12">
          <SheetTitle>
            {mode === "edit" ? "Edit customer" : (customer?.name ?? "Customer")}
          </SheetTitle>
          <SheetDescription>
            {mode === "edit"
              ? "Update the fields below and save."
              : (customer?.company || "Customer details")}
          </SheetDescription>

          {/* View-mode actions: Edit switches in-place, Delete hands off to
              the shared confirmation dialog at page level */}
          {mode === "view" && customer && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setMode("edit")}>
                <PencilIcon />
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => customerId && onDeleteRequest(customerId)}
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

          {mode === "view" && customer && (
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

          {mode === "edit" && customer && (
            <CustomerForm
              defaultValues={{
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                company: customer.company,
                status: customer.status,
                lastContactDate: customer.lastContactDate,
                notes: customer.notes,
              }}
              submitLabel="Save changes"
              isSubmitting={updateMutation.isPending}
              onSubmit={(values) =>
                customerId &&
                updateMutation.mutate(
                  { id: customerId, data: values },
                  {
                    onSuccess: () => {
                      toast.success("Customer updated")
                      setMode("view") // back to read-only view after save
                    },
                    onError: (error) => toast.error(error.message),
                  }
                )
              }
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
