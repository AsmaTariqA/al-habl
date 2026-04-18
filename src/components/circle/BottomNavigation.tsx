"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const items = [
  { href: "/circle",          label: "Circle",   icon: CircleIcon   },
  { href: "/circle/chat",     label: "Chat",     icon: ChatIcon     },
  { href: "/circle/archive",  label: "Archive",  icon: ArchiveIcon  },
  { href: "/circle/members",  label: "Members",  icon: MembersIcon  },
  { href: "/profile",         label: "Profile",  icon: ProfileIcon  },
]

function navIsActive(pathname: string, href: string) {
  return href === "/circle"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`)
}

export function BottomNavigation() {
  const pathname = usePathname()

  return (
    <nav
      style={{
        position: 'fixed',
        inset: 'auto 0 0 0',
        zIndex: 40,
        padding: '0 0.75rem 0.75rem',
        maxWidth: '520px',
        margin: '0 auto',
        left: 0,
        right: 0,
      }}
    >
      <div
        className="glass-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.35rem 0.25rem',
          background: 'color-mix(in srgb, var(--ink-raised) 92%, transparent)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        {items.map(({ href, label, icon: Icon }) => {
          const active = navIsActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                flex: 1,
                padding: '0.5rem 0.25rem',
                borderRadius: 'var(--radius-lg)',
                fontSize: '0.65rem',
                fontWeight: active ? 600 : 400,
                letterSpacing: '0.03em',
                textDecoration: 'none',
                color: active ? 'var(--gold)' : 'var(--muted)',
                background: active ? 'var(--gold-dim)' : 'transparent',
                transition: 'background 0.15s ease, color 0.15s ease',
                textTransform: 'uppercase',
              }}
            >
              <Icon active={active} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function CircleIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={active ? "var(--gold)" : "currentColor"} strokeWidth="1.6">
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.5" fill={active ? "var(--gold)" : "none"} />
    </svg>
  )
}

function ArchiveIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={active ? "var(--gold)" : "currentColor"} strokeWidth="1.6">
      <path d="M5 7h14v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7Z" />
      <path d="M4 3h16v4H4V3Z" />
      <path d="M10 12h4" strokeLinecap="round" />
    </svg>
  )
}

function MembersIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={active ? "var(--gold)" : "currentColor"} strokeWidth="1.6">
      <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M16.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      <path d="M4 19a4 4 0 0 1 8 0" strokeLinecap="round" />
      <path d="M13 19a3.5 3.5 0 0 1 7 0" strokeLinecap="round" />
    </svg>
  )
}

function ChatIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={active ? "var(--gold)" : "currentColor"} strokeWidth="1.6">
      <path d="M6 6h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 3V8a2 2 0 0 1 2-2Z" />
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={active ? "var(--gold)" : "currentColor"} strokeWidth="1.6">
      <circle cx="12" cy="8" r="3" />
      <path d="M5 19a7 7 0 0 1 14 0" strokeLinecap="round" />
    </svg>
  )
}