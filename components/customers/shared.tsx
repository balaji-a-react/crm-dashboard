import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { CustomerStatus } from "@/lib/types"

const statusVariant = {
  active: "default",
  inactive: "secondary",
} as const

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  return <Badge variant={statusVariant[status]}>{status}</Badge>
}

export function formatLastContactDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(isoDate))
}

export function CustomerRowActions() {
  return (
    <div className="flex items-center gap-1">
      {/* Presentational only -- wired to dialogs in a later step */}
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
