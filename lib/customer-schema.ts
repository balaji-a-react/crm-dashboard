import { z } from "zod";

export const customerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]{7,20}$/, "Enter a valid phone number"),
  company: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  lastContactDate: z.string().min(1, "Last contact date is required"),
  notes: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
