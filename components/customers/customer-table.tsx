import {
  CustomerRowActions,
  CustomerStatusBadge,
  formatLastContactDate,
} from "@/components/customers/shared"
import { CustomerCards } from "@/components/customers/customer-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Customer } from "@/lib/customers/types"

function CustomerTableDesktop({ customers }: { customers: Customer[] }) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Contact</TableHead>
            <TableHead className="w-28 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">{customer.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {customer.email}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {customer.phone}
              </TableCell>
              <TableCell>{customer.company}</TableCell>
              <TableCell>
                <CustomerStatusBadge status={customer.status} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatLastContactDate(customer.lastContactDate)}
              </TableCell>
              <TableCell>
                <CustomerRowActions />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function CustomerTable({ customers }: { customers: Customer[] }) {
  return (
    <>
      <div className="hidden md:block">
        <CustomerTableDesktop customers={customers} />
      </div>
      <div className="md:hidden">
        <CustomerCards customers={customers} />
      </div>
    </>
  )
}
