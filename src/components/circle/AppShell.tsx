"use client"

import Link from "next/link"
import { BottomNavigation } from "@/components/circle/BottomNavigation"
import { SidebarNav } from "@/components/circle/SidebarNav"

interface AppShellProps {
  children: React.ReactNode
  pageLabel?: string
  rightPanel?: React.ReactNode
}

export function AppShell({ children, pageLabel, rightPanel }: AppShellProps) {
  return (
    <div className="app-shell">

      {/* ── Desktop sidebar ── */}
      <aside
        className="app-sidebar"
        style={{
          flexDirection: 'column',
          borderRight: '1px solid var(--glass-border)',
          background: 'color-mix(in srgb, var(--ink) 88%, transparent)',
          padding: '1.25rem',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          transition: 'background 0.2s ease, border-color 0.2s ease',
        }}
      >
        <div style={{ marginBottom: '2rem', paddingLeft: '0.25rem' }}>
          <Link href="/circle" style={{ textDecoration: 'none' }}>
            <p style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.18em',
              color: 'var(--gold)',
              textTransform: 'uppercase',
            }}>
              Al-Habl
            </p>
          </Link>
          {pageLabel && (
            <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
              {pageLabel}
            </p>
          )}
        </div>
        <SidebarNav />
      </aside>

      {/* ── Main content ── */}
      <div className="app-main" style={{ minHeight: '100vh' }}>
        {children}
      </div>

      {/* ── Optional right panel ── */}
      {rightPanel && (
        <aside
          className="app-right-panel"
          style={{
            flexDirection: 'column',
            borderLeft: '1px solid var(--glass-border)',
            background: 'color-mix(in srgb, var(--ink) 92%, transparent)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            transition: 'background 0.2s ease, border-color 0.2s ease',
          }}
        >
          {rightPanel}
        </aside>
      )}

      {/* ── Mobile bottom nav ── */}
      <div className="lg:hidden">
        <BottomNavigation />
      </div>
    </div>
  )
}
