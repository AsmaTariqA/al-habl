"use client"

import { useEffect, useState } from "react"

/**
 * Returns true when `(min-width: <breakpoint>px)` matches the viewport.
 * SSR-safe: starts as `false` until the first client effect runs.
 */
export function useMinWidth(breakpointPx: number) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const mql = window.matchMedia(`(min-width: ${breakpointPx}px)`)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    setMatches(mql.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [breakpointPx])

  return matches
}
