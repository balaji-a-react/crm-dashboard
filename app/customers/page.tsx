"use client"

import * as React from "react"
import { SearchIcon } from "lucide-react"

import { AddCustomerDialog } from "@/components/customers/add-customer-dialog"
import { CustomerCardsSection } from "@/components/customers/customer-card"
import {
  CustomerTableSection,
} from "@/components/customers/customer-table"
import { CustomerDetailSheet } from "@/components/customers/customer-detail-sheet"
import { EditCustomerDialog } from "@/components/customers/edit-customer-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCustomerRowActions } from "@/hooks/use-customer-row-actions"
import { useCustomers } from "@/hooks/use-customers"
import type { CustomerListParams } from "@/lib/types"

type SortField = NonNullable<CustomerListParams["sortBy"]>;

export default function CustomersPage() {
  // --- Local UI/filter state ------------------------------------------------
  const [searchInput, setSearchInput] = React.useState(""); // raw keystrokes
  const [search, setSearch] = React.useState(""); // debounced value -> API
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [sortBy, setSortBy] = React.useState<SortField>("name");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");

  // Debounce raw input into `search` so we don't hit the API per keystroke.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1); // a new search always means a new result set
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // --- Server state ---------------------------------------------------------
  const { data, isLoading, isError, error } = useCustomers({
    search,
    sortBy,
    sortOrder,
    page,
    pageSize,
  });

  // --- Shared row/card actions (ONE instance for both views) ----------------
  const rowActions = useCustomerRowActions();

  // Same three callbacks go to table AND cards so their behavior can never
  // diverge -- only the trigger elements differ.
  const viewActions = {
    onOpenDetail: rowActions.openDetail,
    onOpenEdit: rowActions.openEdit,
    onDeleteRequest: rowActions.requestDelete,
  };

  const sectionState = {
    isLoading,
    isError,
    error: isError ? (error as Error) : null,
    customers: data?.data,
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  // Name for the delete confirmation copy; falls back if the record isn't
  // on the current page (possible when deleting from a detail opened earlier).
  const deleteTargetName =
    data?.data.find((c) => c.id === rowActions.deleteTarget)?.name ??
    "this customer";

  /** Clicking a sortable header: first click sorts asc, second toggles desc. */
  function handleSort(field: SortField) {
    if (field === sortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  }

  /** Sliding window of max 5 page numbers centred on the current page. */
  function getPageNumbers(): number[] {
    const window = 5;
    let start = Math.max(1, page - Math.floor(window / 2));
    const end = Math.min(totalPages, start + window - 1);
    start = Math.max(1, end - window + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
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
        {/* Visible in both layouts (table & cards) */}
        <AddCustomerDialog />
      </div>

      {/* Toolbar: search + page size */}
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
        <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          Rows per page
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 25, 50].map((size) => (
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
        <CustomerCardsSection {...sectionState} actions={viewActions} />
      </div>

      {/* Pagination: Previous / numbered pages / Next */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data ? `${data.total} customer${data.total === 1 ? "" : "s"}` : ""}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          {getPageNumbers().map((n) => (
            <Button
              key={n}
              variant={n === page ? "default" : "outline"}
              size="sm"
              onClick={() => setPage(n)}
            >
              {n}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
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
      <CustomerDetailSheet
        key={rowActions.selectedCustomerId ?? "none"}
        customerId={rowActions.selectedCustomerId}
        open={rowActions.detailSheetOpen}
        onOpenChange={(next) => {
          if (!next) rowActions.closeSheet()
        }}
        onEditRequest={(id) => {
          // Edit uses the shared dialog (same modal as Add), so the sheet
          // steps aside to avoid stacking two overlays.
          rowActions.closeSheet()
          rowActions.openEdit(id)
        }}
        onDeleteRequest={rowActions.requestDelete}
      />

      {/* Shared edit modal: same Dialog + CustomerForm as Add, prefilled */}
      <EditCustomerDialog
        customerId={rowActions.editCustomerId}
        open={rowActions.editDialogOpen}
        onOpenChange={(next) => {
          if (!next) rowActions.closeEdit()
        }}
      />

      {/* Single delete confirmation for every trigger in either view */}
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
            <AlertDialogAction onClick={rowActions.confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
