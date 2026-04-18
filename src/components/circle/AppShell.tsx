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
    <div style={{ minHeight: '100vh', background: 'var(--ink)', color: 'var(--text)' }}>

      {/* ── Desktop sidebar ── */}
      <aside
        style={{
          display: 'none',
          position: 'fixed',
          left: 0, top: 0,
          zIndex: 30,
          height: '100%',
          width: '240px',
          flexDirection: 'column',
          borderRight: '1px solid var(--glass-border)',
          background: 'color-mix(in srgb, var(--ink) 88%, transparent)',
          padding: '1.25rem',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          transition: 'background 0.2s ease, border-color 0.2s ease',
        }}
        className="lg:!flex"
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

      {/*
        ── Page content ──
        On lg+: offset left by 240px (sidebar) AND right by 240px (mirror),
        so the remaining strip is perfectly centered in the viewport.
        When rightPanel exists, offset right by 320px instead.
        On mobile: no offsets, full width.
      */}
      <div
        className={
          rightPanel
            ? "lg:pl-[240px] lg:pr-[240px] xl:pr-[320px]"
            : "lg:pl-[240px] lg:pr-[240px]"
        }
        style={{ minHeight: '100vh' }}
      >
        {children}
      </div>

      {/* ── Optional right panel ── */}
      {rightPanel && (
        <aside
          style={{
            display: 'none',
            position: 'fixed',
            right: 0, top: 0,
            height: '100%',
            width: '320px',
            flexDirection: 'column',
            borderLeft: '1px solid var(--glass-border)',
            background: 'color-mix(in srgb, var(--ink) 92%, transparent)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: 20,
            overflowY: 'auto',
            transition: 'background 0.2s ease, border-color 0.2s ease',
          }}
          className="xl:!flex xl:!flex-col"
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