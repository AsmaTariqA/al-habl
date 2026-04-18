"use client"

// src/components/circle/SidebarNav.tsx
// Desktop sidebar navigation — replaces BottomNavigation on lg+ screens

import Link from "next/link"
import { usePathname } from "next/navigation"

const items = [
  {
    href: "/circle",
    label: "Circle",
    icon: (active: boolean) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={active ? "var(--gold)" : "currentColor"} strokeWidth="1.5">
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="2.5" fill={active ? "var(--gold)" : "none"} />
      </svg>
    ),
  },
  {
    href: "/circle/archive",
    label: "Archive",
    icon: (active: boolean) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={active ? "var(--gold)" : "currentColor"} strokeWidth="1.5">
        <path d="M5 7h14v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7Z" />
        <path d="M4 3h16v4H4V3Z" />
        <path d="M10 12h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/circle/chat",
    label: "Chat",
    icon: (active: boolean) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={active ? "var(--gold)" : "currentColor"} strokeWidth="1.5">
        <path d="M6 6h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 3V8a2 2 0 0 1 2-2Z" />
      </svg>
    ),
  },
  {
    href: "/circle/members",
    label: "Members",
    icon: (active: boolean) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={active ? "var(--gold)" : "currentColor"} strokeWidth="1.5">
        <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M16.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
        <path d="M4 19a4 4 0 0 1 8 0" strokeLinecap="round" />
        <path d="M13 19a3.5 3.5 0 0 1 7 0" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (active: boolean) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={active ? "var(--gold)" : "currentColor"} strokeWidth="1.5">
        <circle cx="12" cy="8" r="3" />
        <path d="M5 19a7 7 0 0 1 14 0" strokeLinecap="round" />
      </svg>
    ),
  },
]

export function SidebarNav() {
  const pathname = usePathname()

  async function handleLogout() {
    const confirmed = window.confirm("Are you sure you want to log out?")
    if (!confirmed) return
    await fetch("/api/auth/logout", { method: "POST" })
    localStorage.clear()
    window.location.href = "/auth/login"
  }

  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      {items.map(({ href, label, icon }) => {
        const active = href === "/circle" ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.65rem",
              padding: "0.55rem 0.75rem",
              borderRadius: "var(--radius-md)",
              fontSize: "0.875rem",
              fontWeight: active ? 500 : 400,
              letterSpacing: "-0.01em",
              textDecoration: "none",
              border: `1px solid ${active ? "var(--gold-border)" : "transparent"}`,
              background: active ? "var(--gold-dim)" : "transparent",
              color: active ? "var(--gold)" : "var(--muted)",
              transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
            }}
            onMouseEnter={e => {
              if (!active) {
                (e.currentTarget as HTMLAnchorElement).style.background = "var(--glass-strong)"
                ;(e.currentTarget as HTMLAnchorElement).style.color = "var(--text)"
              }
            }}
            onMouseLeave={e => {
              if (!active) {
                (e.currentTarget as HTMLAnchorElement).style.background = "transparent"
                ;(e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)"
              }
            }}
          >
            {icon(active)}
            <span>{label}</span>
          </Link>
        )
      })}

      <div style={{ height: "1px", background: "var(--divider)", margin: "0.5rem 0" }} />

      <button
        type="button"
        onClick={() => void handleLogout()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.65rem",
          padding: "0.55rem 0.75rem",
          borderRadius: "var(--radius-md)",
          fontSize: "0.875rem",
          fontWeight: 400,
          background: "transparent",
          border: "1px solid transparent",
          color: "var(--muted)",
          cursor: "pointer",
          width: "100%",
          textAlign: "left",
          transition: "background 0.15s ease, color 0.15s ease",
        }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.06)"
          ;(e.currentTarget as HTMLButtonElement).style.color = "#f87171"
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLButtonElement).style.background = "transparent"
          ;(e.currentTarget as HTMLButtonElement).style.color = "var(--muted)"
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" />
          <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" />
        </svg>
        <span>Log out</span>
      </button>
    </nav>
  )
}