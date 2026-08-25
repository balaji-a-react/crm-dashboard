"use client"

import * as React from "react"
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { Field, FieldError, FieldLabel } from "@/components/ui/Field"
import { Input } from "@/components/ui/Input"

interface FormInputFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: string
  type?: string
  placeholder?: string
  /** Visual required marker on the label; validation itself lives in zod. */
  required?: boolean
  /** Optional value transformer applied before the value reaches RHF
   * (e.g. sanitizers that cap length / strip disallowed characters). */
  transform?: (value: string) => string
}

/**
 * Labelled text input bound to a react-hook-form field. Generates its own
 * unique id so the label/input stay associated even with multiple instances.
 *
 * Error UX: the CONTROL carries the error state (red border/ring via the
 * primitives' `aria-invalid:*` variants) alongside a text message; the label
 * stays neutral. The message slot reserves one line of height so the layout
 * never jumps when the error appears/disappears.
 */
export function FormInputField<T extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  placeholder,
  required,
  transform,
}: FormInputFieldProps<T>) {
  const id = React.useId()
  const errorId = `${id}-error`

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field className="gap-1.5">
          <FieldLabel htmlFor={id}>
            {label}
            {required && (
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            )}
          </FieldLabel>
          <Input
            id={id}
            type={type}
            placeholder={placeholder}
            {...field}
            onChange={(e) =>
              field.onChange(transform ? transform(e.target.value) : e.target.value)
            }
            aria-required={required || undefined}
            aria-invalid={fieldState.invalid || undefined}
            aria-describedby={fieldState.invalid ? errorId : undefined}
          />
          {/* Compact reserved line (text-xs) so the layout never jumps */}
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
