"use client"

import * as React from "react"
import { toast } from "sonner"

import { useDeleteCustomer } from "@/hooks/use-customers"

/**
 * WHY THIS HOOK EXISTS
 *
 * The customer list renders the SAME data twice (table on desktop, cards on
 * mobile). Without a shared hook, each view would own its own copies of
 * "open sheet", "which mode", and "what is pending deletion" -- and they
 * WILL drift apart (e.g. table opens view mode, cards open edit mode).
 *
 * This hook is the single source of truth for that behavior: both views get
 * identical callbacks, so a click on a table row and a click on a card are
 * guaranteed to do exactly the same thing.
 */
export function useCustomerRowActions() {
  // Which customer the detail sheet shows. Kept while the sheet closes so
  // cached data stays visible during the exit animation.
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<
    string | null
  >(null)
  const [detailSheetOpen, setDetailSheetOpen] = React.useState(false)
  const [sheetMode, setSheetMode] = React.useState<"view" | "edit">("view")

  // Id pending delete confirmation -- non-null renders the shared AlertDialog.
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null)

  const deleteMutation = useDeleteCustomer()

  function openDetail(id: string) {
    setSelectedCustomerId(id)
    setSheetMode("view")
    setDetailSheetOpen(true)
  }

  function openEdit(id: string) {
    setSelectedCustomerId(id)
    setSheetMode("edit")
    setDetailSheetOpen(true)
  }

  function closeSheet() {
    setDetailSheetOpen(false)
  }

  function requestDelete(id: string) {
    setDeleteTarget(id)
  }

  function cancelDelete() {
    setDeleteTarget(null)
  }

  function confirmDelete() {
    if (!deleteTarget) return

    deleteMutation.mutate(deleteTarget, {
      onSuccess: () => {
        toast.success("Customer deleted")
        // If the deleted record was open in the sheet, close it too --
        // otherwise the user would be staring at stale data.
        if (deleteTarget === selectedCustomerId) {
          setDetailSheetOpen(false)
        }
        setDeleteTarget(null)
      },
      onError: (error) => toast.error(error.message),
    })
  }

  return {
    selectedCustomerId,
    detailSheetOpen,
    sheetMode,
    openDetail,
    openEdit,
    closeSheet,
    /** Id pending confirmation; drives the page-level AlertDialog `open`. */
    deleteTarget,
    requestDelete,
    confirmDelete,
    cancelDelete,
  }
}
