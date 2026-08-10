"use client"

/**
 * Circle route group chrome: plain app background wrapper.
 *
 * The desktop sidebar, (optional) right member panel, and mobile bottom nav
 * are rendered ONCE by the AppShell that each view mounts, so this layout
 * does not duplicate any of them. Previously this rendered a second fixed
 * sidebar + a 240px left offset + a second bottom nav, which (combined with
 * AppShell's own shell) created a 480px gap, crushed the center column at
 * ~1300px, and showed a duplicate bottom nav on mobile.
 *
 * Kept client-only because it may be extended in the future with browser-only
 * features (e.g. route-based analytics).
 */
export function CircleAppChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--ink)] text-[var(--text)]">
      {children}
    </div>
  )
}
