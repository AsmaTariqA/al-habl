"use client"

import { useQuery } from "@tanstack/react-query"
import { qfKeys } from "@/lib/qf/queryKeys"
import { qfProfileQueryFn } from "@/lib/qf/queryFns"

export function useQfProfileQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: qfKeys.profile(),
    queryFn: qfProfileQueryFn,
    staleTime: 120_000,
    enabled: options?.enabled ?? true,
  })
}
