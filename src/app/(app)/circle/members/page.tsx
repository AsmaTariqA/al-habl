"use client"

import { useEffect, useState } from "react"
import { BottomNavigation } from "@/components/circle/BottomNavigation"
import { useCircle } from "@/hooks/useCircle"
import { session } from "@/lib/session"

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export default function MembersPage() {
  const [roomId, setRoomId] = useState<string | null>(() => session.getRoomId())
  const [copied, setCopied] = useState(false)
  const { room, members, loading } = useCircle(roomId)

  useEffect(() => {
    if (roomId) return

    const restoreRoom = async () => {
      const response = await fetch('/api/circle')
      const data = await response.json()
      if (data.room?.id) {
        session.setRoomId(data.room.id)
        setRoomId(data.room.id)
      }
    }

    void restoreRoom()
  }, [roomId])

  async function copyCode() {
    if (!room?.invite_code) return
    await navigator.clipboard.writeText(room.invite_code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  async function shareCode() {
    if (!room?.invite_code) return
    if (navigator.share) {
      await navigator.share({
        title: "Al-Habl Circle Invite",
        text: `Join my Al-Habl circle with code ${room.invite_code}`,
      })
      return
    }
    await copyCode()
  }

  return (
    <div className="min-h-screen bg-[var(--ink)] pb-24 text-[var(--text)]">
      <main className="circle-shell space-y-4 pt-6">
        <section className="glass-card space-y-3 p-5">
          <p className="muted-kicker">Members</p>
          <h1 className="text-3xl font-semibold">Your study companions</h1>
          <p className="text-sm text-[var(--muted)]">See who has reflected today and share the room invite code when you need to.</p>
        </section>

        <section className="glass-card space-y-4 p-5">
          <div className="flex items-center justify-between">
            <p className="text-lg font-medium">Invite Code</p>
            {copied ? <span className="text-xs text-[var(--gold)]">Copied</span> : null}
          </div>
          <div className="rounded-[20px] border border-[var(--gold-border)] bg-[var(--gold-dim)] px-4 py-5 text-center">
            <p className="font-mono text-3xl tracking-[0.34em] text-[var(--gold)]">{room?.invite_code ?? '------'}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" className="button-secondary w-full" onClick={() => void copyCode()}>Copy invite code</button>
            <button type="button" className="button-secondary w-full" onClick={() => void shareCode()}>Share invite</button>
          </div>
        </section>

        <section className="glass-card space-y-4 p-5">
          <div className="flex items-center justify-between"><p className="text-lg font-medium">Circle Members</p><span className="text-sm text-[var(--gold)]">{members.length}</span></div>
          {loading ? (
            <div className="space-y-3">
              <div className="skeleton h-16 rounded-[20px]" />
              <div className="skeleton h-16 rounded-[20px]" />
              <div className="skeleton h-16 rounded-[20px]" />
            </div>
          ) : members.length === 0 ? (
            <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-dim)] p-8 text-center">
              <p className="text-base font-medium text-[var(--gold)]">No members yet</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Invite your companions to begin.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between rounded-[18px] border border-white/8 bg-white/4 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full border ${member.has_reflected_today ? 'border-[var(--gold-border)] bg-[var(--gold-dim)] text-[var(--gold)]' : 'border-white/10 bg-white/5 text-[var(--muted)]'}`}>{getInitials(member.username)}</div>
                    <div>
                      <p className="text-sm">{member.username}</p>
                      <p className="text-xs text-[var(--muted)]">Joined {new Date(member.joined_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs ${member.has_reflected_today ? 'border border-[var(--gold-border)] bg-[var(--gold-dim)] text-[var(--gold)]' : 'border border-white/10 bg-white/5 text-[var(--muted)]'}`}>{member.has_reflected_today ? 'Reflected today' : 'Waiting today'}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <BottomNavigation />
    </div>
  )
}
