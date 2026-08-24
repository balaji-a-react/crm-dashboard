export const CUSTOMER_STATUSES = [
  "Lead",
  "Active",
  "Inactive",
  "Churned",
] as const

export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number]

export type Customer = {
  id: string
  name: string
  email: string
  phone: string
  company: string
  status: CustomerStatus
  lastContactDate: string
}
