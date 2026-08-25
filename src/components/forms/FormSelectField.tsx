"use client"

import * as React from "react"
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { Field, FieldError, FieldLabel } from "@/components/ui/Field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"

interface FormSelectFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: string
  options: { label: string; value: string }[]
  /** Visual required marker on the label; validation itself lives in zod. */
  required?: boolean
}

/**
 * Error UX mirrors FormInputField: red border/ring on the trigger via
 * `aria-invalid`, neutral label, and a space-reserved message slot.
 */
export function FormSelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  required,
}: FormSelectFieldProps<T>) {
  const errorId = React.useId()

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field className="gap-1.5">
          <FieldLabel>
            {label}
            {required && (
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            )}
          </FieldLabel>
          {/* Base UI Select is controlled; bridge it to RHF manually.
              Passing `items` makes SelectValue render the option label
              (e.g. "Active") instead of the raw stored value ("active"). */}
          <Select
            value={field.value}
            onValueChange={(v) => field.onChange(v)}
            items={options}
          >
            <SelectTrigger
              className="w-full"
              aria-required={required || undefined}
              aria-invalid={fieldState.invalid || undefined}
              aria-describedby={fieldState.invalid ? errorId : undefined}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
