"use client"

import { BottomNavigation } from "@/components/circle/BottomNavigation"
import { SidebarNav } from "@/components/circle/SidebarNav"

export default function CircleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[var(--ink)] text-[var(--text)]">
      <aside className="hidden lg:flex fixed left-0 top-0 z-30 h-full w-60 flex-col border-r border-white/6 bg-[rgba(15,14,12,0.8)] p-4 backdrop-blur-xl">
        <div className="mb-8 px-2">
          <p className="text-sm font-bold tracking-[0.2em] text-[var(--gold)] uppercase">Al-Habl</p>
          <p className="mt-0.5 text-xs text-[var(--muted)]">Circle</p>
        </div>
        <SidebarNav />
      </aside>

      <div className="lg:pl-60">
        {children}
      </div>

      <div className="lg:hidden">
        <BottomNavigation />
      </div>
    </div>
  )
}
