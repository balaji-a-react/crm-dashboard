"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { FormInputField } from "@/components/ui/form-input-field"
import { FormSelectField } from "@/components/ui/form-select-field"
import { FormTextareaField } from "@/components/ui/form-textarea-field"
import {
  customerFormSchema,
  limitPhoneNumber,
  type CustomerFormValues,
} from "@/lib/customer-schema"

export interface CustomerFormProps {
  /** Pre-fill fields (used by the Edit flow); Add passes nothing. */
  defaultValues?: Partial<CustomerFormValues>
  onSubmit: (data: CustomerFormValues) => void
  /** Renders a Cancel action in the footer (dialogs should offer one). */
  onCancel?: () => void
  isSubmitting: boolean
  submitLabel: string
}

/**
 * Shared add/edit form. Validation is declared once in
 * `lib/customer-schema.ts` (zod) and wired via zodResolver, so both flows
 * can never diverge in their rules.
 *
 * Note: this registry uses the `Field` primitives (Field/FieldLabel/
 * FieldError) rather than a classic `Form` wrapper -- each field is bound
 * through react-hook-form's `Controller`, encapsulated in the shared
 * `form-*-field` primitives in `components/ui`.
 */
export function CustomerForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
}: CustomerFormProps) {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      status: "active",
      lastContactDate: "",
      notes: "",
      ...defaultValues,
    },
  })

  return (
    // Container-query grid: two columns when the HOST has room (the wide
    // Add/Edit dialog), single column in narrow hosts -- because
    // the breakpoint tracks the form's container, not the viewport.
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate // let zod messages drive validation UX instead of the browser
      className="@container grid gap-x-3 gap-y-2 @lg:grid-cols-2"
    >
      <FormInputField
        control={form.control}
        name="name"
        label="Name"
        placeholder="Jane Doe"
        required
      />

      <FormInputField
        control={form.control}
        name="email"
        label="Email"
        type="email"
        placeholder="jane@company.com"
        required
      />

      <FormInputField
        control={form.control}
        name="phone"
        label="Phone"
        placeholder="+91 9876543210"
        required
        // E.164: hard-cap at 15 digits while typing, not just on submit.
        transform={limitPhoneNumber}
      />

      <FormInputField
        control={form.control}
        name="company"
        label="Company"
        placeholder="Acme Corp"
      />

      <FormSelectField
        control={form.control}
        name="status"
        label="Status"
        options={[
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
        ]}
      />

      <FormInputField
        control={form.control}
        name="lastContactDate"
        label="Last contact date"
        type="date"
        required
      />

      <FormTextareaField
        control={form.control}
        name="notes"
        label="Notes"
        rows={3}
        placeholder="Anything worth remembering…"
        className="@lg:col-span-2"
      />

      {/* Dialog convention: actions right-aligned in a footer, not a
          full-width button. Lives inside <form> so submit still works. */}
      <DialogFooter className="@lg:col-span-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2Icon className="animate-spin" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )
}
