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

  return (
    <nav className="space-y-1">
      {items.map(({ href, label, icon }) => {
        const active = href === "/circle" ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
              active
                ? "bg-[var(--gold-dim)] text-[var(--gold)] border border-[var(--gold-border)]"
                : "text-[var(--muted)] hover:bg-white/5 hover:text-[var(--text)]"
            }`}
          >
            {icon(active)}
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
