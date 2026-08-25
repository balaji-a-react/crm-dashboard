"use client"

import * as React from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowUpDownIcon,
  GripVerticalIcon,
} from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  DragOverlay,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

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
import { cn } from "@/lib/utils"

type SortField = NonNullable<CustomerListParams["sortBy"]>;

// ---------------------------------------------------------------------------
// Column model
//
// `render` present -> how the BODY cell renders; absent falls back to the
// customer property matching the column id (name/email/phone/company).
// The "actions" column is NOT part of the sortable order -- it is always
// rendered last, outside the SortableContext, so it can never be dragged
// or displaced.
// ---------------------------------------------------------------------------

interface ColumnDef {
  id: string;
  label: string;
  sortField?: SortField;
  /** Extra classes for the body cell (header uses headClass). */
  cellClass?: string;
  headClass?: string;
  render?: (customer: Customer) => React.ReactNode;
}

const COLUMNS: ColumnDef[] = [
  { id: "name", label: "Name", sortField: "name", cellClass: "font-medium" },
  {
    id: "email",
    label: "Email",
    sortField: "email",
    cellClass: "text-muted-foreground",
  },
  {
    id: "phone",
    label: "Phone",
    cellClass: "whitespace-nowrap text-muted-foreground",
  },
  { id: "company", label: "Company" },
  {
    id: "status",
    label: "Status",
    render: (customer) => <CustomerStatusBadge status={customer.status} />,
  },
  {
    id: "lastContact",
    label: "Last Contact",
    sortField: "lastContactDate",
    cellClass: "whitespace-nowrap text-muted-foreground",
    render: (customer) => formatLastContactDate(customer.lastContactDate),
  },
];

const DEFAULT_COLUMN_ORDER = COLUMNS.map((c) => c.id);

// ---------------------------------------------------------------------------
// Column-order persistence (localStorage)
//
// Column layout is a personal DISPLAY preference, not shareable list state --
// unlike filters/sort/page (URL params), it follows the saved-filters
// precedent of localStorage. Readers validate defensively so a stale or
// corrupted payload silently falls back to the default order.
// ---------------------------------------------------------------------------

const COLUMN_ORDER_KEY = "crm-dashboard.customer-columns";

function readColumnOrder(): string[] {
  if (typeof window === "undefined") return DEFAULT_COLUMN_ORDER;
  try {
    const raw = window.localStorage.getItem(COLUMN_ORDER_KEY);
    if (!raw) return DEFAULT_COLUMN_ORDER;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_COLUMN_ORDER;
    const ids = parsed.filter((x): x is string => typeof x === "string");
    const isValid =
      ids.length === DEFAULT_COLUMN_ORDER.length &&
      ids.every((id) => DEFAULT_COLUMN_ORDER.includes(id));
    return isValid ? ids : DEFAULT_COLUMN_ORDER;
  } catch {
    return DEFAULT_COLUMN_ORDER;
  }
}

/**
 * localStorage consumed through useSyncExternalStore:
 * - getSnapshot returns a CACHED array so repeated reads are referentially
 *   stable (the hook's contract), replaced only on an explicit write.
 * - getServerSnapshot yields the default order, so SSR HTML always matches
 *   the hydration render; any persisted order applies right after mount.
 */
let orderCache: string[] | null = null;
const orderListeners = new Set<() => void>();

function getColumnOrderSnapshot(): string[] {
  if (orderCache === null) orderCache = readColumnOrder();
  return orderCache;
}

function subscribeToColumnOrder(onChange: () => void): () => void {
  orderListeners.add(onChange);
  return () => orderListeners.delete(onChange);
}

/** Persist a new order and notify subscribed components. */
function commitColumnOrder(order: string[]): void {
  orderCache = order;
  try {
    window.localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(order));
  } catch {
    // Storage full/disabled -- persistence is best-effort only.
  }
  orderListeners.forEach((listener) => listener());
}

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
 *
 * Columns are re-orderable via dnd-kit: drag a header's grip (or focus it
 * and press Space/arrows). Only headers participate in sorting -- the whole
 * grid re-renders in the new order on drop, keeping body-cell transforms
 * out of the hot path.
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
  const columnOrder = React.useSyncExternalStore(
    subscribeToColumnOrder,
    getColumnOrderSnapshot,
    () => DEFAULT_COLUMN_ORDER
  );
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // Distance constraint keeps plain clicks (sort toggle) from becoming drags.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const orderedColumns = columnOrder.map(
    (id) => COLUMNS.find((c) => c.id === id)!
  );
  const totalColumns = orderedColumns.length + 1; // + pinned Actions

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    commitColumnOrder(
      arrayMove(
        columnOrder,
        columnOrder.indexOf(String(active.id)),
        columnOrder.indexOf(String(over.id))
      )
    );
  }

  const activeColumn = activeId
    ? COLUMNS.find((c) => c.id === activeId)
    : null;

  function renderCell(customer: Customer, column: ColumnDef) {
    if (column.render) return column.render(customer);
    const value = customer[column.id as keyof Customer];
    return typeof value === "string" ? value : "";
  }

  return (
    <div className="rounded-lg border">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <SortableContext
                items={columnOrder}
                strategy={horizontalListSortingStrategy}
              >
                {orderedColumns.map((column) => (
                  <SortableHeaderCell
                    key={column.id}
                    column={column}
                    isActive={activeId === column.id}
                    sort={sort}
                  />
                ))}
              </SortableContext>
              {/* Pinned: never sortable, always last */}
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Skeleton rows keep the layout stable while loading */}
            {isLoading &&
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {Array.from({ length: totalColumns }).map((_, j) => (
                    <TableCell key={`cell-${j}`}>
                      <Skeleton className="h-4 w-[80%]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {isError && (
              <TableRow>
                <TableCell colSpan={totalColumns} className="h-32 text-center">
                  <span className="text-destructive">
                    Failed to load customers: {error?.message}
                  </span>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && (customers?.length ?? 0) === 0 && (
              <TableRow>
                <TableCell colSpan={totalColumns} className="h-32 text-center">
                  <span className="text-muted-foreground">
                    No customers found
                  </span>
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !isError &&
              customers?.map((customer) => (
                // Row click opens the detail dialog (view mode); the action
                // buttons stop their own propagation.
                <TableRow
                  key={customer.id}
                  className="cursor-pointer"
                  onClick={() => actions.onOpenDetail(customer.id)}
                >
                  {orderedColumns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={cn(column.cellClass)}
                    >
                      {renderCell(customer, column)}
                    </TableCell>
                  ))}
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

        {/* Floating chip while dragging; headers themselves shift live */}
        <DragOverlay>
          {activeColumn && (
            <div className="inline-flex items-center gap-1 rounded-md bg-popover px-2 py-1 text-sm font-medium shadow-md ring-1 ring-foreground/10">
              {activeColumn.label}
              <GripVerticalIcon className="size-3.5 text-muted-foreground" />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

/**
 * One draggable <th>. Drag listeners live ONLY on the grip button so the
 * sort-toggle button keeps its click behavior untouched. While a neighbour
 * is dragged, dnd-kit translates this header to preview the drop position.
 */
function SortableHeaderCell({
  column,
  isActive,
  sort,
}: {
  column: ColumnDef;
  isActive: boolean;
  sort?: CustomerSortState;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  return (
    <TableHead
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        column.headClass,
        isDragging && "relative z-10 opacity-30",
        isActive && !isDragging && "text-foreground"
      )}
    >
      <span className="flex items-center gap-0.5">
        {sort && column.sortField ? (
          <button
            type="button"
            onClick={() => sort.onSort(column.sortField!)}
            className="flex items-center gap-1 hover:text-foreground"
          >
            {column.label}
            {sort.field === column.sortField ? (
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
          column.label
        )}
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${column.label} column`}
          title="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
          className="ml-0.5 cursor-grab touch-none rounded p-0.5 text-muted-foreground/40 hover:bg-muted hover:text-muted-foreground active:cursor-grabbing"
        >
          <GripVerticalIcon className="size-3.5" />
        </button>
      </span>
    </TableHead>
  );
}
