"use client"

import * as React from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Loader2Icon, SearchIcon } from "lucide-react"

import { AddCustomerDialog } from "@/modules/customers/components/AddCustomerDialog"
import { AdvancedFiltersSheet } from "@/modules/customers/components/AdvancedFiltersSheet"
import { CustomerCardsSection } from "@/modules/customers/components/CustomerCard"
import {
  CustomerTableSection,
} from "@/modules/customers/components/CustomerTableSection"
import { CustomerDetailDialog } from "@/modules/customers/components/CustomerDetailDialog"
import { EditCustomerDialog } from "@/modules/customers/components/EditCustomerDialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { useCustomerRowActions } from "@/modules/customers/hooks/use-customer-row-actions"
import { useCustomers } from "@/modules/customers/hooks/use-customers"
import {
  countActiveFilters,
  filterStateToParams,
  searchParamsToFilters,
  filtersToParamUpdates,
  type CustomerFilterState,
} from "@/modules/customers/services/customer-filters"
import type { CustomerListParams } from "@/modules/customers/types/customer"

type SortField = NonNullable<CustomerListParams["sortBy"]>;

/**
 * useSearchParams() opts this page out of static prerendering -- Next.js
 * requires the consuming subtree to sit behind a <Suspense> boundary so the
 * shell can still be prerendered while params resolve on the client.
 * Without it, `next build` aborts with a CSR-bailout error.
 */
export default function CustomersPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-8">
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CustomersPageContent />
    </React.Suspense>
  )
}

function CustomersPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Derive all state from URL search params (URL = single source of truth)
  const { filters, search: urlSearch, sortBy, sortOrder, page, pageSize } =
    searchParamsToFilters(searchParams)

  // searchInput = local-only raw keystrokes; not in the URL until debounce fires
  const [searchInput, setSearchInput] = React.useState(urlSearch)

  // Debounce keystrokes → update URL.  Uses a ref so stale closures never read
  // an old searchParams snapshot.  Synced via useEffect to satisfy the
  // react-hooks/refs lint rule.
  const searchParamsRef = React.useRef(searchParams)
  React.useEffect(() => {
    searchParamsRef.current = searchParams
  })

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim()
      if (trimmed !== (searchParamsRef.current.get("q") ?? "")) {
        // Mutate a copy so an emptied input actually DELETES q -- spreading
        // the old params here would carry the stale value forward.
        const next = new URLSearchParams(searchParamsRef.current)
        if (trimmed) next.set("q", trimmed)
        else next.delete("q")
        next.set("page", "1") // a new search always means a new result set
        router.replace(`${pathname}?${next.toString()}`, { scroll: false })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, pathname, router])

  /** Merge any param changes and reset to page 1. */
  function updateURL(updates: Record<string, string | null>, keepPage = false) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") next.delete(key)
      else next.set(key, value)
    }
    if (!keepPage) next.delete("page")
    router.replace(`${pathname}?${next.toString()}`, { scroll: false })
  }

  // --- Filter / sort / pagination handlers --------------------------------

  function handleFiltersChange(next: CustomerFilterState) {
    updateURL({ ...filtersToParamUpdates(next) })
  }

  function handleSort(field: SortField) {
    const nextSortOrder = field === sortBy && sortOrder === "asc" ? "desc" : "asc"
    updateURL({ sortBy: field, sortOrder: nextSortOrder })
  }

  function handlePageChange(newPage: number) {
    updateURL({ page: String(newPage) }, true)
  }

  function handlePageSizeChange(newSize: number) {
    updateURL({ pageSize: String(newSize) })
  }

  // --- Server state -------------------------------------------------------
  const filterParams = React.useMemo(
    () => filterStateToParams(filters),
    [filters]
  )

  const { data, isLoading, isError, error } = useCustomers({
    search: urlSearch,
    ...filterParams,
    sortBy,
    sortOrder,
    page,
    pageSize,
  })

  // --- Shared row/card actions (ONE instance for both views) ---------------
  const rowActions = useCustomerRowActions()

  const viewActions = {
    onOpenDetail: rowActions.openDetail,
    onOpenEdit: rowActions.openEdit,
    onDeleteRequest: rowActions.requestDelete,
  }

  const sectionState = {
    isLoading,
    isError,
    error: isError ? (error as Error) : null,
    customers: data?.data,
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  const deleteTargetName =
    data?.data.find((c) => c.id === rowActions.deleteTarget)?.name ??
    "this customer"

  /** Sliding window of max 5 page numbers centred on the current page. */
  function getPageNumbers(): number[] {
    const window = 5
    let start = Math.max(1, page - Math.floor(window / 2))
    const end = Math.min(totalPages, start + window - 1)
    start = Math.max(1, end - window + 1)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Manage your customer relationships and contact history.
          </p>
        </div>
        <AddCustomerDialog />
      </div>

      {/* Toolbar: search + advanced filters + page size */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, email or company…"
            className="pl-8"
          />
        </div>
        <AdvancedFiltersSheet
          filters={filters}
          onChange={handleFiltersChange}
          activeCount={countActiveFilters(filters)}
        />
        <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          Rows per page
          <Select
            value={String(pageSize)}
            onValueChange={(value) => handlePageSizeChange(Number(value))}
          >
            <SelectTrigger className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>

      {/* Responsive list: table >md, cards <=md -- pure CSS switch */}
      <div className="hidden md:block">
        <CustomerTableSection
          {...sectionState}
          actions={viewActions}
          sort={{ field: sortBy, order: sortOrder, onSort: handleSort }}
        />
      </div>
      <div className="md:hidden">
        <CustomerCardsSection
          {...sectionState}
          actions={viewActions}
          sort={{ field: sortBy, order: sortOrder, onSort: handleSort }}
        />
      </div>

      {/* Pagination: Previous / numbered pages / Next.
          Stacks vertically on mobile (the button row alone exceeds a phone
          viewport) and goes side-by-side from sm up. */}
      <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {data ? `${data.total} customer${data.total === 1 ? "" : "s"}` : ""}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            Previous
          </Button>
          {getPageNumbers().map((n) => (
            <Button
              key={n}
              variant={n === page ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(n)}
            >
              {n}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {/*
        WHY THESE ARE RENDERED ONCE AT PAGE LEVEL
        -----------------------------------------
        The table has up to `pageSize` rows and the card list similar. If each
        row/card mounted its own Sheet/Dialog/AlertDialog, we'd instantiate
        dozens of portal'd overlay components at once for overlays that are
        visually singletons anyway. One controlled instance driven by the
        shared hook is lighter and guarantees consistent behavior across both
        views (desktop table + mobile cards).
      */}
      <CustomerDetailDialog
        key={rowActions.selectedCustomerId ?? "none"}
        customerId={rowActions.selectedCustomerId}
        open={rowActions.detailSheetOpen}
        onOpenChange={(next) => {
          if (!next) rowActions.closeSheet()
        }}
        onEditRequest={(id) => {
          rowActions.closeSheet()
          rowActions.openEdit(id)
        }}
        onDeleteRequest={rowActions.requestDelete}
      />

      <EditCustomerDialog
        customerId={rowActions.editCustomerId}
        open={rowActions.editDialogOpen}
        onOpenChange={(next) => {
          if (!next) rowActions.closeEdit()
        }}
      />

      <AlertDialog
        open={!!rowActions.deleteTarget}
        onOpenChange={(open) => {
          if (!open) rowActions.cancelDelete()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteTargetName}. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={rowActions.isDeleting}
              onClick={rowActions.confirmDelete}
            >
              {rowActions.isDeleting && (
                <Loader2Icon className="animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
