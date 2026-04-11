"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const items = [
  { href: "/circle", label: "Circle", icon: CircleIcon },
  { href: "/circle/chat", label: "Chat", icon: ChatIcon },
  { href: "/circle/archive", label: "Archive", icon: ArchiveIcon },
  { href: "/circle/members", label: "Members", icon: MembersIcon },
  { href: "/profile", label: "Profile", icon: ProfileIcon },
]

function navIsActive(pathname: string, href: string) {
  return href === "/circle"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`)
}

export function BottomNavigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[480px] px-4 pb-4">
      <div className="glass-card flex items-center justify-between border-white/10 bg-[linear-gradient(180deg,rgba(33,30,25,0.92),rgba(15,14,12,0.88))] px-2 py-2 shadow-[0_-10px_40px_rgba(0,0,0,0.18)]">
        {items.map(({ href, label, icon: Icon }) => {
          const active = navIsActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] transition ${
                active
                  ? "bg-[var(--gold-dim)] text-[var(--gold)]"
                  : "text-[var(--muted)] hover:bg-white/4 hover:text-[var(--text)]"
              }`}
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

function iconClass(active: boolean) {
  return active ? "stroke-[var(--gold)]" : "stroke-current"
}

function CircleIcon({ active }: { active: boolean }) {
  return (
    <svg className={iconClass(active)} width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="7" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2.5" fill={active ? "var(--gold)" : "none"} strokeWidth="1.5" />
    </svg>
  )
}

function ArchiveIcon({ active }: { active: boolean }) {
  return (
    <svg className={iconClass(active)} width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M5 7h14v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7Z" strokeWidth="1.5" />
      <path d="M4 3h16v4H4V3Z" strokeWidth="1.5" />
      <path d="M10 12h4" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function MembersIcon({ active }: { active: boolean }) {
  return (
    <svg className={iconClass(active)} width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" strokeWidth="1.5" />
      <path d="M16.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" strokeWidth="1.5" />
      <path d="M4 19a4 4 0 0 1 8 0" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 19a3.5 3.5 0 0 1 7 0" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ChatIcon({ active }: { active: boolean }) {
  return (
    <svg className={iconClass(active)} width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M6 6h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 3V8a2 2 0 0 1 2-2Z" strokeWidth="1.5" />
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg className={iconClass(active)} width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3" strokeWidth="1.5" />
      <path d="M5 19a7 7 0 0 1 14 0" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
