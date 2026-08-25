import { PencilIcon, Trash2Icon } from "lucide-react"

import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import type { CustomerStatus } from "@/modules/customers/types/customer"

const statusVariant = {
  active: "default",
  inactive: "secondary",
} as const

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  return <Badge variant={statusVariant[status]}>
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </Badge>
}

export function formatLastContactDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(isoDate))
}

/**
 * Shared edit/delete icon pair used by BOTH table rows and cards.
 * Buttons stop propagation so they don't trigger the parent row/card's
 * "open detail" click.
 */
export function CustomerRowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        title="Edit"
        onClick={(e) => {
          e.stopPropagation()
          onEdit()
        }}
      >
        <PencilIcon />
        <span className="sr-only">Edit</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        title="Delete"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <Trash2Icon />
        <span className="sr-only">Delete</span>
      </Button>
    </div>
  )
}
