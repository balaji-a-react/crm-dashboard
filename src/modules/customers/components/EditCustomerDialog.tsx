"use client"

import * as React from "react"
import { toast } from "sonner"

import { CustomerForm } from "@/modules/customers/components/CustomerForm"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog"
import { Skeleton } from "@/components/ui/Skeleton"
import {
  useCustomer,
  useUpdateCustomer,
} from "@/modules/customers/hooks/use-customers"

export interface EditCustomerDialogProps {
  /** Customer to load; null keeps the dialog closed/mounted for animations. */
  customerId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * The edit twin of AddCustomerDialog: SAME Dialog + CustomerForm (so the
 * two flows can never diverge visually or functionally), differences only:
 * it loads the record and prefills the form.
 *
 * Rendered ONCE at page level with controlled open state (like the delete
 * AlertDialog) so the desktop table and mobile cards share one instance.
 */
export function EditCustomerDialog({
  customerId,
  open,
  onOpenChange,
}: EditCustomerDialogProps) {
  // Only fetch while actually open (the id lingers after close for the
  // exit animation -- don't refetch then).
  const { data: customer, isLoading } = useCustomer(
    open && customerId ? customerId : undefined
  )
  const updateMutation = useUpdateCustomer()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Same width as Add so the form gets two columns on desktop.
          Height-capped with an internal scroll area (like the detail
          dialog) so short viewports can always reach every field. */}
      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 gap-1 border-b pr-8 pb-3">
          <DialogTitle>Edit customer</DialogTitle>
          <DialogDescription>
            Update the fields below and save.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}

        {!isLoading && !customer && (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Customer not found.
          </p>
        )}

        {customer && (
          // key remounts the form fresh on every open/customer change
          <CustomerForm
            key={`${customerId}-${open}`}
            className="pt-3"
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
            onCancel={() => onOpenChange(false)}
            onSubmit={(values) =>
              customerId &&
              updateMutation.mutate(
                { id: customerId, data: values },
                {
                  onSuccess: () => {
                    toast.success("Customer updated")
                    onOpenChange(false)
                  },
                  onError: (error) => toast.error(error.message),
                }
              )
            }
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
