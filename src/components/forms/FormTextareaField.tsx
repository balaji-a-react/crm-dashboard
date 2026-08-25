"use client"

import * as React from "react"
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { Field, FieldError, FieldLabel } from "@/components/ui/Field"
import { Textarea } from "@/components/ui/Textarea"
import { cn } from "@/utils/cn"

interface FormTextareaFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: string
  placeholder?: string
  rows?: number
  /** Visual required marker on the label; validation itself lives in zod. */
  required?: boolean
  /** Forwarded to the wrapping Field, e.g. grid span utilities. */
  className?: string
}

/**
 * Error UX mirrors FormInputField: red border/ring on the control via
 * `aria-invalid`, neutral label, and a space-reserved message slot.
 */
export function FormTextareaField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  rows = 3,
  required,
  className,
}: FormTextareaFieldProps<T>) {
  const id = React.useId()
  const errorId = `${id}-error`

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field className={cn("gap-1.5", className)}>
          <FieldLabel htmlFor={id}>
            {label}
            {required && (
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            )}
          </FieldLabel>
          <Textarea
            id={id}
            rows={rows}
            placeholder={placeholder}
            {...field}
            aria-required={required || undefined}
            aria-invalid={fieldState.invalid || undefined}
            aria-describedby={fieldState.invalid ? errorId : undefined}
          />
          <div id={errorId} className="min-h-4 -mt-0.5">
            {fieldState.error && (
              <FieldError className="text-xs" errors={[fieldState.error]} />
            )}
          </div>
        </Field>
      )}
    />
  )
}
