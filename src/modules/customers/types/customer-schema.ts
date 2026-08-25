import { z } from "zod";

/**
 * E.164 (universal telecom standard): international phone numbers hold at
 * most 15 DIGITS (country code included). Separators (space - ( ) .) are
 * allowed for readability but never counted.
 */
export const MAX_PHONE_DIGITS = 15;
const MIN_PHONE_DIGITS = 7;

export function isValidPhone(value: string): boolean {
  // Optional leading "+" only, then digits and separator characters.
  if (!/^\+?[\d\s\-().]*$/.test(value)) return false;
  const digits = value.replace(/\D/g, "");
  return (
    digits.length >= MIN_PHONE_DIGITS && digits.length <= MAX_PHONE_DIGITS
  );
}

/**
 * Live-input sanitizer: strips disallowed characters and hard-stops once
 * MAX_PHONE_DIGITS digits have been consumed (everything after is dropped),
 * so an over-long number can never even enter the field.
 */
export function limitPhoneNumber(value: string): string {
  let out = "";
  let digits = 0;
  for (const ch of value) {
    if (/\d/.test(ch)) {
      if (digits >= MAX_PHONE_DIGITS) break;
      digits += 1;
      out += ch;
    } else if (ch === "+" ? out === "" : /[\s\-().]/.test(ch)) {
      // "+" is only meaningful as the first character.
      out += ch;
    }
  }
  return out;
}

export const customerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().refine(isValidPhone, "Enter a valid phone number (7–15 digits)"),
  company: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  lastContactDate: z.string().min(1, "Last contact date is required"),
  notes: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
