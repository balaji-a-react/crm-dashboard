import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowUpDownIcon,
} from "lucide-react"

import {
  CustomerRowActions,
  CustomerStatusBadge,
  formatLastContactDate,
} from "@/components/customers/shared"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Customer, CustomerListParams } from "@/lib/types"

type SortField = NonNullable<CustomerListParams["sortBy"]>;

// Column descriptors: `sortField` present -> clickable sortable header.
const COLUMNS: { label: string; sortField?: SortField; headClass?: string }[] = [
  { label: "Name", sortField: "name" },
  { label: "Email", sortField: "email" },
  { label: "Phone" },
  { label: "Company" },
  { label: "Status" },
  { label: "Last Contact", sortField: "lastContactDate" },
  { label: "Actions", headClass: "w-28 text-right" },
];

export interface CustomerSectionState {
  isLoading: boolean
  isError: boolean
  error: Error | null
  customers?: Customer[]
}

export interface CustomerSortState {
  field: SortField
  order: "asc" | "desc"
  onSort: (field: SortField) => void
}

/** Identical action callbacks for table and cards -- see useCustomerRowActions. */
export interface CustomerViewActions {
  onOpenDetail: (id: string) => void
  onOpenEdit: (id: string) => void
  onDeleteRequest: (id: string) => void
}

/**
 * Desktop (>md) presentation of the customer list, including its
 * loading/error/empty states so the page stays a thin composer.
 */
export function CustomerTableSection({
  isLoading,
  isError,
  error,
  customers,
  sort,
  actions,
}: CustomerSectionState & {
  sort?: CustomerSortState
  actions: CustomerViewActions
}) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {COLUMNS.map(({ label, sortField, headClass }) => (
              <TableHead key={label} className={headClass}>
                {sort && sortField ? (
                  // Sortable header: asc on first click, toggles desc after
                  <button
                    type="button"
                    onClick={() => sort.onSort(sortField)}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    {label}
                    {sort.field === sortField ? (
                      sort.order === "asc" ? (
                        <ArrowUpIcon className="size-3" />
                      ) : (
                        <ArrowDownIcon className="size-3" />
                      )
                    ) : (
                      <ArrowUpDownIcon className="size-3 opacity-40" />
                    )}
                  </button>
                ) : (
                  label
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Skeleton rows keep the layout stable while loading */}
          {isLoading &&
            Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <TableCell key={`cell-${j}`}>
                    <Skeleton className="h-4 w-[80%]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}

          {isError && (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center">
                <span className="text-destructive">
                  Failed to load customers: {error?.message}
                </span>
              </TableCell>
            </TableRow>
          )}

          {!isLoading && !isError && (customers?.length ?? 0) === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center">
                <span className="text-muted-foreground">No customers found</span>
              </TableCell>
            </TableRow>
          )}

          {!isLoading &&
            !isError &&
            customers?.map((customer) => (
              // Row click opens the detail sheet (view mode)
              <TableRow
                key={customer.id}
                className="cursor-pointer"
                onClick={() => actions.onOpenDetail(customer.id)}
              >
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
                  <div className="flex items-center justify-end">
                    <CustomerRowActions
                      onEdit={() => actions.onOpenEdit(customer.id)}
                      onDelete={() => actions.onDeleteRequest(customer.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  )
}
