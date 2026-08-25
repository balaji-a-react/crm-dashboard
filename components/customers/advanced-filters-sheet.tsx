"use client"

import * as React from "react"
import {
  BookmarkIcon,
  ChevronsUpDownIcon,
  MailIcon,
  PhoneIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useCompanies } from "@/hooks/use-customers"
import {
  EMPTY_FILTER_STATE,
  FILTER_TEMPLATES,
  countActiveFilters,
  isEmptyFilterState,
  readSavedFilters,
  writeSavedFilters,
  type CustomerFilterState,
  type SavedFilter,
} from "@/lib/customer-filters"
import type { CustomerStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const STATUS_OPTIONS: { value: CustomerStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
]

function toggleValue<T>(list: T[], value: T, checked: boolean): T[] {
  return checked ? [...list, value] : list.filter((v) => v !== value)
}

/** Small labelled block used for every filter row, keeping spacing uniform. */
function FilterSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </div>
  )
}

/**
 * Advanced Filters Panel (sidebar sheet).
 *
 * Fully controlled: the parent owns the filter state via `filters` + `onChange`.
 * Every toggle / input calls `onChange` immediately (no draft, no Apply button)
 * so the URL is always up to date.
 *
 * The panel only mounts while the sheet is open, so saved filters are loaded
 * fresh each time from localStorage via a state initializer.
 */
export function AdvancedFiltersSheet({
  filters,
  onChange,
  activeCount,
}: {
  filters: CustomerFilterState
  onChange: (next: CustomerFilterState) => void
  activeCount: number
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant={activeCount > 0 ? "secondary" : "outline"} />}
      >
        <SlidersHorizontalIcon />
        Filters
        {activeCount > 0 && (
          <Badge variant="secondary" className="ml-1">
            {activeCount}
          </Badge>
        )}
      </SheetTrigger>

      {open && (
        <SheetContent>
          <AdvancedFiltersPanel filters={filters} onChange={onChange} />
        </SheetContent>
      )}
    </Sheet>
  )
}

function AdvancedFiltersPanel({
  filters,
  onChange,
}: {
  filters: CustomerFilterState
  onChange: (next: CustomerFilterState) => void
}) {
  const [saveName, setSaveName] = React.useState("")
  const [savedFilters, setSavedFilters] = React.useState<SavedFilter[]>(() =>
    readSavedFilters()
  )

  const { data: companies = [] } = useCompanies()

  const activeCount = countActiveFilters(filters)
  const canSave = !isEmptyFilterState(filters) && saveName.trim().length > 0

  function patch(partial: Partial<CustomerFilterState>) {
    onChange({ ...filters, ...partial })
  }

  function saveCurrent() {
    const entry: SavedFilter = {
      id: crypto.randomUUID(),
      name: saveName.trim(),
      state: { ...filters },
    }
    const next = [...savedFilters, entry]
    setSavedFilters(next)
    writeSavedFilters(next)
    setSaveName("")
    toast.success(`Filter "${entry.name}" saved`)
  }

  function deleteSaved(id: string) {
    const target = savedFilters.find((f) => f.id === id)
    const next = savedFilters.filter((f) => f.id !== id)
    setSavedFilters(next)
    writeSavedFilters(next)
    if (target) toast.success(`Filter "${target.name}" deleted`)
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>Advanced filters</SheetTitle>
        <SheetDescription>
          {activeCount > 0
            ? `${activeCount} of 6 filters selected`
            : "No filters selected yet"}
        </SheetDescription>
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
        {/* --- Pre-built templates -------------------------------------- */}
        <FilterSection title="Templates">
          <div className="flex flex-col gap-1">
            {FILTER_TEMPLATES.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                className="h-auto w-full justify-start py-1.5"
                onClick={() => onChange(template.build())}
              >
                <span className="flex flex-col items-start">
                  <span>{template.label}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {template.description}
                  </span>
                </span>
              </Button>
            ))}
          </div>
        </FilterSection>

        <Separator />

        {/* --- Status (checkboxes) -------------------------------------- */}
        <FilterSection title="Status">
          <div className="flex flex-col gap-2.5">
            {STATUS_OPTIONS.map(({ value, label }) => (
              <Label
                key={value}
                className="-mx-1 cursor-pointer rounded-md px-1 py-0.5 font-normal hover:bg-muted/50"
              >
                <Checkbox
                  checked={filters.status.includes(value)}
                  onCheckedChange={(checked) =>
                    patch({
                      status: toggleValue(filters.status, value, checked === true),
                    })
                  }
                />
                {label}
              </Label>
            ))}
          </div>
        </FilterSection>

        {/* --- Company (multi-select dropdown) --------------------------- */}
        <FilterSection title="Company">
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  className="w-full justify-between font-normal"
                />
              }
            >
              <span
                className={cn(
                  "truncate",
                  filters.company.length === 0 && "text-muted-foreground"
                )}
              >
                {filters.company.length === 0
                  ? "Any company"
                  : filters.company.length === 1
                    ? filters.company[0]
                    : `${filters.company.length} companies selected`}
              </span>
              <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent align="start" className="p-1">
              <div className="max-h-56 overflow-y-auto">
                {companies.map((company) => (
                  <Label
                    key={company}
                    className="cursor-pointer rounded-md px-2 py-1.5 font-normal hover:bg-muted"
                  >
                    <Checkbox
                      checked={filters.company.includes(company)}
                      onCheckedChange={(checked) =>
                        patch({
                          company: toggleValue(
                            filters.company,
                            company,
                            checked === true
                          ),
                        })
                      }
                    />
                    <span className="truncate">{company}</span>
                  </Label>
                ))}
                {companies.length === 0 && (
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">
                    No companies found
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </FilterSection>

        {/* --- Last contact date range ----------------------------------- */}
        <FilterSection title="Last contact date">
          <div className="grid grid-cols-2 gap-2">
            <Label className="flex-col items-start gap-1.5 font-normal">
              <span className="text-xs text-muted-foreground">From</span>
              <Input
                type="date"
                value={filters.dateFrom}
                max={filters.dateTo || undefined}
                onChange={(e) => patch({ dateFrom: e.target.value })}
              />
            </Label>
            <Label className="flex-col items-start gap-1.5 font-normal">
              <span className="text-xs text-muted-foreground">To</span>
              <Input
                type="date"
                value={filters.dateTo}
                min={filters.dateFrom || undefined}
                onChange={(e) => patch({ dateTo: e.target.value })}
              />
            </Label>
          </div>
        </FilterSection>

        {/* --- Phone (partial match) -------------------------------------- */}
        <FilterSection title="Phone number">
          <div className="relative">
            <PhoneIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.phone}
              onChange={(e) => patch({ phone: e.target.value })}
              placeholder="Partial match, e.g. 555"
              className="pl-8"
              inputMode="tel"
            />
          </div>
        </FilterSection>

        {/* --- Email (partial match) --------------------------------------- */}
        <FilterSection title="Email">
          <div className="relative">
            <MailIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.email}
              onChange={(e) => patch({ email: e.target.value })}
              placeholder="Partial match, e.g. acme.io"
              className="pl-8"
              inputMode="email"
            />
          </div>
        </FilterSection>

        <Separator />

        {/* --- Saved custom filters ---------------------------------------- */}
        <FilterSection title="Saved filters">
          {savedFilters.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {savedFilters.map((saved) => (
                <li key={saved.id} className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 min-w-0 flex-1 justify-start font-normal"
                    title={`Apply "${saved.name}"`}
                    onClick={() => onChange(saved.state)}
                  >
                    <BookmarkIcon className="shrink-0 text-muted-foreground" />
                    <span className="truncate">{saved.name}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title={`Delete "${saved.name}"`}
                    onClick={() => deleteSaved(saved.id)}
                  >
                    <Trash2Icon />
                    <span className="sr-only">Delete {saved.name}</span>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              No saved filters yet. Set filters above and save the combination
              with a name.
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSave) saveCurrent()
              }}
              placeholder='Name this filter, e.g. "Q3 follow-ups"'
              className="flex-1"
            />
            <Button
              variant="secondary"
              disabled={!canSave}
              onClick={saveCurrent}
            >
              Save
            </Button>
          </div>
        </FilterSection>
      </div>

      {/* Footer: only Clear All (no Apply -- changes are real-time) */}
      <div className="flex border-t px-6 py-3">
        <Button
          variant="outline"
          className="w-full"
          disabled={isEmptyFilterState(filters)}
          onClick={() => onChange(EMPTY_FILTER_STATE)}
        >
          Clear all
        </Button>
      </div>
    </>
  )
}
