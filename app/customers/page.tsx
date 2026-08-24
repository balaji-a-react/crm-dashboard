import { CustomerTable } from "@/components/customers/customer-table"
import { customers } from "@/lib/customers/data"

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground">
          Manage your customer relationships and contact history.
        </p>
      </div>
      <CustomerTable customers={customers} />
    </div>
  )
}
