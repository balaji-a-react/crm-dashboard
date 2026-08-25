"use client"

import * as React from "react"
import { toast } from "sonner"

import { useDeleteCustomer } from "@/modules/customers/hooks/use-customers"

/**
 * WHY THIS HOOK EXISTS
 *
 * The customer list renders the SAME data twice (table on desktop, cards on
 * mobile). Without a shared hook, each view would own its own copies of
 * "open detail", "which customer is being edited", and "what is pending
 * deletion" -- and they WILL drift apart.
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

  // Which customer the shared edit dialog shows (same modal as Add).
  const [editCustomerId, setEditCustomerId] = React.useState<string | null>(
    null
  )
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)

  // Id pending delete confirmation -- non-null renders the shared AlertDialog.
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null)

  const deleteMutation = useDeleteCustomer()

  function openDetail(id: string) {
    setSelectedCustomerId(id)
    setDetailSheetOpen(true)
  }

  function openEdit(id: string) {
    setEditCustomerId(id)
    setEditDialogOpen(true)
  }

  function closeSheet() {
    setDetailSheetOpen(false)
  }

  function closeEdit() {
    setEditDialogOpen(false)
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
        // Deletions are destructive -- red toast (not green success).
        toast.error("Customer deleted")
        // If the deleted record was open in the sheet or edit dialog, close
        // it too -- otherwise the user would be staring at stale data.
        if (deleteTarget === selectedCustomerId) {
          setDetailSheetOpen(false)
        }
        if (deleteTarget === editCustomerId) {
          setEditDialogOpen(false)
        }
        setDeleteTarget(null)
      },
      onError: (error) => toast.error(error.message),
    })
  }

  return {
    selectedCustomerId,
    detailSheetOpen,
    openDetail,
    closeSheet,
    editCustomerId,
    editDialogOpen,
    openEdit,
    closeEdit,
    /** Id pending confirmation; drives the page-level AlertDialog `open`. */
    deleteTarget,
    requestDelete,
    confirmDelete,
    cancelDelete,
    /** True between confirmDelete() and the mutation settling -- drives the
     * spinner/disabled state on the confirmation button. */
    isDeleting: deleteMutation.isPending,
  }
}
