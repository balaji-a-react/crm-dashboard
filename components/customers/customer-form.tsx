"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  customerFormSchema,
  type CustomerFormValues,
} from "@/lib/customer-schema"

export interface CustomerFormProps {
  /** Pre-fill fields (used by the Edit flow); Add passes nothing. */
  defaultValues?: Partial<CustomerFormValues>
  onSubmit: (data: CustomerFormValues) => void
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
 * through react-hook-form's `Controller`.
 */
export function CustomerForm({
  defaultValues,
  onSubmit,
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
    // Add dialog), single column in narrow hosts (the edit sheet) -- because
    // the breakpoint tracks the form's container, not the viewport.
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate // let zod messages drive validation UX instead of the browser
      className="@container grid grid-cols-1 gap-4 @lg:grid-cols-2"
    >
      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="customer-name">Name</FieldLabel>
            <Input id="customer-name" placeholder="Jane Doe" {...field} />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="email"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="customer-email">Email</FieldLabel>
            <Input
              id="customer-email"
              type="email"
              placeholder="jane@company.com"
              {...field}
            />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="phone"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="customer-phone">Phone</FieldLabel>
            <Input id="customer-phone" placeholder="+1 (555) 000-0000" {...field} />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="company"
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor="customer-company">Company</FieldLabel>
            <Input id="customer-company" placeholder="Acme Corp" {...field} />
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="status"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel>Status</FieldLabel>
            {/* Base UI Select is controlled; bridge it to RHF manually */}
            <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="lastContactDate"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="customer-last-contact">Last contact date</FieldLabel>
            <Input id="customer-last-contact" type="date" {...field} />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="notes"
        render={({ field }) => (
          <Field className="@lg:col-span-2">
            <FieldLabel htmlFor="customer-notes">Notes</FieldLabel>
            <Textarea
              id="customer-notes"
              rows={3}
              placeholder="Anything worth remembering…"
              {...field}
            />
          </Field>
        )}
      />

      <Button type="submit" disabled={isSubmitting} className="@lg:col-span-2">
        {isSubmitting && <Loader2Icon className="animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  )
}
