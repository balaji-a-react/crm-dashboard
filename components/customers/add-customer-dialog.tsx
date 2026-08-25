"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { CustomerForm } from "@/components/customers/customer-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAddCustomer } from "@/hooks/use-customers"

/**
 * Self-contained dialog: owns its own open state and trigger button so the
 * page only renders `<AddCustomerDialog />` once.
 */
export function AddCustomerDialog({ ...props }: React.ComponentProps<"div">) {
  const [open, setOpen] = React.useState(false)
  const { mutate, isPending } = useAddCustomer()

  return (
    <div {...props}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button />}>
          <PlusIcon />
          Add Customer
        </DialogTrigger>
        {/* Wider than the default sm:max-w-sm so the form can use two columns */}
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add customer</DialogTitle>
            <DialogDescription>
              Create a new customer record. Fields marked required must be
              filled in.
            </DialogDescription>
          </DialogHeader>

          {/* key remounts the form fresh every time the dialog opens */}
          <CustomerForm
            key={String(open)}
            submitLabel="Add Customer"
            isSubmitting={isPending}
            onCancel={() => setOpen(false)}
            onSubmit={(values) =>
              // The API/store contract requires `company` as a string;
              // normalize the optional zod field before sending.
              mutate(
                { ...values, company: values.company ?? "" },
                {
                  onSuccess: () => {
                    toast.success("Customer added")
                    setOpen(false)
                  },
                  onError: (error) => toast.error(error.message),
                }
              )
            }
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
