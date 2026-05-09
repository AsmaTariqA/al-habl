"use client"

import { useQuery } from "@tanstack/react-query"
import { qfKeys } from "@/lib/qf/queryKeys"
import { qfStreaksQueryFn } from "@/lib/qf/queryFns"

export function useQfStreaksQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: qfKeys.streaks(),
    queryFn: qfStreaksQueryFn,
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
  })
}
