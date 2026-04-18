"use client"

import { useEffect, useMemo, useState } from "react"
import { AppShell } from "@/components/circle/AppShell"
import { useCircle } from "@/hooks/useCircle"
import { session } from "@/lib/session"

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")
}

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

  useEffect(() => {
    if (roomId) return
    const restoreRoom = async () => {
      const response = await fetch("/api/circle")
      const data = await response.json()
      if (data.room?.id) { session.setRoomId(data.room.id); setRoomId(data.room.id) }
    }
    void restoreRoom()
  }, [roomId])

  useEffect(() => { if (room?.name) setEditName(room.name) }, [room?.name])

  const uniqueMembers = useMemo(() => {
    const map = new Map<string, any>()
    for (const m of members || []) {
      const key = getMemberKey(m)
      if (!map.has(key)) map.set(key, m)
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
      await navigator.share({ title: "Al-Habl Circle Invite", text: `Join my Al-Habl circle with code ${room.invite_code}` })
      return
    }
    await copyCode()
  }

  const reflectedToday = uniqueMembers.filter(m => m.has_reflected_today).length

  return (
    <AppShell pageLabel="Members">
      <main style={{ margin: '0 auto', width: '100%', maxWidth: '64rem', padding: '2rem 1rem 6rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Header */}
        <section className="glass-card" style={{ padding: '1.75rem 2rem' }}>
          <span className="muted-kicker" style={{ marginBottom: '0.6rem', display: 'flex' }}>Members</span>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.04em', marginBottom: '0.4rem' }}>
            {room?.name || "Your Circle"}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.65 }}>
            {reflectedToday} of {uniqueMembers.length} reflected today
          </p>
        </section>

        {/* Invite code */}
        <section className="glass-card" style={{ padding: '1.5rem 2rem' }}>
          <p className="muted-kicker" style={{ marginBottom: '1rem', display: 'flex' }}>Invite Code</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1.25rem', background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 700, letterSpacing: '0.25em', color: 'var(--gold)', lineHeight: 1 }}>
                {room?.invite_code ?? "------"}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button className="button-secondary" onClick={copyCode} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                  {copied ? "✓ Copied" : "Copy"}
                </button>
                <button className="button-secondary" onClick={shareCode} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                  Share
                </button>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              Share this code with companions. They can enter it during onboarding to join your circle.
            </p>
          </div>
          {actionMsg && <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--gold)' }}>{actionMsg}</p>}
        </section>

        {/* Members list */}
        <section className="glass-card" style={{ padding: '1.5rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <p className="muted-kicker" style={{ display: 'flex' }}>Circle</p>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--gold)', background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', padding: '0.2rem 0.6rem', borderRadius: '99px' }}>
              {uniqueMembers.length} {uniqueMembers.length === 1 ? 'member' : 'members'}
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '76px', borderRadius: 'var(--radius-md)' }} />)}
            </div>
          ) : uniqueMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <p style={{ fontWeight: 600, color: 'var(--gold)', marginBottom: '0.4rem' }}>No members yet</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Share your invite code to begin.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {uniqueMembers.map((member) => {
                const key = getMemberKey(member)
                const active = member.has_reflected_today
                const isAdmin = member.user_id === room?.created_by
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', background: 'var(--glass)', border: `1px solid ${active ? 'var(--gold-border)' : 'var(--glass-border)'}`, borderRadius: 'var(--radius-md)', transition: 'border-color 0.15s ease' }}>
                    <div style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600, background: active ? 'var(--gold-dim2)' : 'var(--glass-strong)', border: `1px solid ${active ? 'var(--gold-border)' : 'var(--glass-border)'}`, color: active ? 'var(--gold)' : 'var(--muted)' }}>
                      {getInitials(member.username)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--text)' }}>{member.username}</p>
                        {isAdmin && (
                          <span style={{ fontSize: '0.62rem', padding: '0.1rem 0.45rem', borderRadius: '99px', background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            Admin
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        {member.joined_at ? `Joined ${new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Recently joined'}
                      </p>
                    </div>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: active ? 'var(--gold)' : 'var(--glass-border)', flexShrink: 0, boxShadow: active ? '0 0 6px var(--gold)' : 'none', transition: 'all 0.2s ease' }} />
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </AppShell>
  )
}