import { PencilIcon, Trash2Icon, MoreHorizontalIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Customer, CustomerStatus } from "@/lib/customers/types"

const statusVariant: Record<
  CustomerStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  Active: "default",
  Lead: "secondary",
  Inactive: "outline",
  Churned: "destructive",
}

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(isoDate))
}

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  return <Badge variant={statusVariant[status]}>{status}</Badge>
}

export function CustomerRowActions() {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" title="Edit">
        <PencilIcon />
        <span className="sr-only">Edit</span>
      </Button>
      <Button variant="ghost" size="icon" title="Delete">
        <Trash2Icon />
        <span className="sr-only">Delete</span>
      </Button>
      <Button variant="ghost" size="icon" title="More">
        <MoreHorizontalIcon />
        <span className="sr-only">More</span>
      </Button>
    </div>
  )
}

export function CustomerTable({ customers }: { customers: Customer[] }) {
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
                {formatDate(customer.lastContactDate)}
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
