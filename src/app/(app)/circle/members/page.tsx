"use client"

import { useEffect, useMemo, useState } from "react"
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

// ✅ Create a SAFE unique key for every member
function getMemberKey(member: any) {
  if (member?.user_id) return String(member.user_id)
  if (member?.username) return `username-${member.username}`
  return `unknown-${Math.random().toString(36).slice(2)}`
}

export default function MembersPage() {
  const [roomId, setRoomId] = useState<string | null>(() => session.getRoomId())
  const [copied, setCopied] = useState(false)
  const [editName, setEditName] = useState("")
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  const { room, members, loading } = useCircle(roomId)
  const userId = session.getUserId()

  // Restore room if missing
  useEffect(() => {
    if (roomId) return

    const restoreRoom = async () => {
      const response = await fetch("/api/circle")
      const data = await response.json()
      if (data.room?.id) {
        session.setRoomId(data.room.id)
        setRoomId(data.room.id)
      }
    }

    void restoreRoom()
  }, [roomId])

  // Sync name
  useEffect(() => {
    if (room?.name) setEditName(room.name)
  }, [room?.name])

  // ✅ FIXED: stable dedupe using real keys only
  const uniqueMembers = useMemo(() => {
    const map = new Map<string, any>()

    for (const m of members || []) {
      const key = getMemberKey(m)

      // keep first occurrence only
      if (!map.has(key)) {
        map.set(key, m)
      }
    }

    return Array.from(map.values())
  }, [members])

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
    <div className="min-h-screen bg-[var(--ink)] text-[var(--text)]">
      <main className="mx-auto w-full max-w-5xl px-4 py-8 pb-28 space-y-6">

        {/* Header */}
        <section className="glass-card p-6 space-y-2">
          <p className="muted-kicker">Members</p>
          <h1 className="text-3xl sm:text-4xl font-semibold">
            {room?.name || "Your Circle"}
          </h1>
          <p className="section-subcopy">
            Manage your circle and stay connected with your companions.
          </p>
        </section>

        {/* Invite */}
        <section className="glass-card p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-[var(--muted)] mb-1">Invite Code</p>
              <p className="font-mono text-2xl tracking-[0.3em] text-[var(--gold)]">
                {room?.invite_code ?? "------"}
              </p>
            </div>

            <div className="flex gap-2">
              <button className="button-secondary" onClick={copyCode}>
                {copied ? "Copied" : "Copy"}
              </button>
              <button className="button-secondary" onClick={shareCode}>
                Share
              </button>
            </div>
          </div>

          {actionMsg && (
            <p className="text-sm text-[var(--gold)]">{actionMsg}</p>
          )}
        </section>

        {/* Members */}
        <section className="glass-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-lg font-medium">Members</p>
            <span className="text-sm text-[var(--gold)]">
              {uniqueMembers.length}
            </span>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={`skeleton-${i}`} className="skeleton h-20 rounded-xl" />
              ))}
            </div>
          ) : uniqueMembers.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[var(--gold)] font-medium">
                No members yet
              </p>
              <p className="text-sm text-[var(--muted)] mt-1">
                Share your invite code to begin.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {uniqueMembers.map((member) => {
                const key = getMemberKey(member)

                return (
                  <div
                    key={key}
                    className="rounded-xl border border-white/8 bg-white/4 p-4 flex items-center gap-3"
                  >
                    <div
                      className={`h-12 w-12 flex items-center justify-center rounded-full border ${
                        member.has_reflected_today
                          ? "border-[var(--gold-border)] bg-[var(--gold-dim)] text-[var(--gold)]"
                          : "border-white/10 bg-white/5 text-[var(--muted)]"
                      }`}
                    >
                      {getInitials(member.username)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm">{member.username}</p>

                        {member.user_id === room?.created_by && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--gold-dim)] text-[var(--gold)] border border-[var(--gold-border)]">
                            Admin
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[var(--muted)]">
                        Joined{" "}
                        {member.joined_at
                          ? new Date(member.joined_at).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>

                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        member.has_reflected_today
                          ? "bg-[var(--gold-dim)] text-[var(--gold)] border border-[var(--gold-border)]"
                          : "bg-white/5 text-[var(--muted)] border border-white/10"
                      }`}
                    >
                      {member.has_reflected_today ? "Active" : "Idle"}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}