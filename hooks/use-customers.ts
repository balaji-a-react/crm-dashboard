"use client"

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  createCustomer,
  deleteCustomer,
  fetchCompanies,
  fetchCustomer,
  fetchCustomers,
  updateCustomer,
} from "@/lib/api-client"
import type {
  CustomerListParams,
  CustomerUpdates,
  NewCustomer,
} from "@/lib/types"

// ---------------------------------------------------------------------------
// Query-key structure
//
// List queries:   ["customers", filters]
//                 ^prefix      ^object of CustomerListParams
// Detail queries: ["customers", id]
//
// TanStack Query matches keys by PREFIX, so invalidating ["customers"]
// refetches every list AND detail query at once. Structural hashing means
// two equal filter objects produce the same key even if the object
// reference differs between renders -- safe to build inline.
// ---------------------------------------------------------------------------

export function useCustomers(params: CustomerListParams = {}) {
  return useQuery({
    // The filters object is part of the key -> every filter combination
    // is cached and refetched independently (spec requirement).
    queryKey: ["customers", params],
    queryFn: () => fetchCustomers(params),
    staleTime: 30_000, // 30s: filter toggles back and forth hit the cache
    placeholderData: (previous) => previous,
    // ^ while fetching a new page/filter, keep showing the previous result
    //   so the table doesn't flash into the skeleton state on every change
  })
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => fetchCustomer(id as string),
    // Don't run for undefined ids (e.g. before a detail view has an id).
    enabled: !!id,
  })
}

export function useCompanies() {
  return useQuery({
    // Own top-level key: companies are metadata, not a customer list, so
    // ["customers"] invalidations (add/edit/delete) shouldn't refetch them.
    queryKey: ["companies"],
    queryFn: fetchCompanies,
    // Company names change rarely -- keep them warm for the whole session.
    staleTime: 5 * 60_000,
  })
}

export function useAddCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: NewCustomer) => createCustomer(data),
    onSuccess: () => {
      // Prefix match: refetches all list queries regardless of filters.
      void queryClient.invalidateQueries({ queryKey: ["customers"] })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerUpdates }) =>
      updateCustomer(id, data),
    onSuccess: (_customer, variables) => {
      // ["customers"] covers every list; the explicit detail key below
      // is technically redundant (also prefix-matched) but documents intent.
      void queryClient.invalidateQueries({ queryKey: ["customers"] })
      void queryClient.invalidateQueries({
        queryKey: ["customers", variables.id],
      })
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      // If the deleted customer was the only row on the last page,
      // refetching may return an empty page; callers can react via `data`.
      void queryClient.invalidateQueries({ queryKey: ["customers"] })
    },
  })
}
