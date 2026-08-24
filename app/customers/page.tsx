"use client"

import * as React from "react"
import { SearchIcon } from "lucide-react"

import { CustomerCardsSection } from "@/components/customers/customer-card"
import { CustomerTableSection } from "@/components/customers/customer-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  // setState runs inside the timeout callback (async), not synchronously
  // in the effect body.
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

  // Shared view state handed to both the desktop table and mobile cards
  const sectionState = {
    isLoading,
    isError,
    error: isError ? (error as Error) : null,
    customers: data?.data,
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

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
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground">
          Manage your customer relationships and contact history.
        </p>
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
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground"
          >
            {[5, 10, 20].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Responsive list: table >md, cards <=md -- pure CSS switch */}
      <div className="hidden md:block">
        <CustomerTableSection
          {...sectionState}
          sort={{ field: sortBy, order: sortOrder, onSort: handleSort }}
        />
      </div>
      <div className="md:hidden">
        <CustomerCardsSection {...sectionState} />
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
    </div>
  )
}
