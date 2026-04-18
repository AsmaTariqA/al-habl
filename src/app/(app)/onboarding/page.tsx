"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { session } from "@/lib/session"

interface CircleRow {
  id: string
  name: string
  description?: string
  member_count: number
  created_at: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [circleName, setCircleName] = useState("")
  const [description, setDescription] = useState("")
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null)
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null)
  const [circles, setCircles] = useState<CircleRow[]>([])
  const [circlesLoading, setCirclesLoading] = useState(true)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/circle")
      .then(r => r.json())
      .then((data: { room?: { id: string } | null; circles?: CircleRow[] }) => {
        setCircles(data.circles ?? [])
      })
      .catch(() => {})
      .finally(() => setCirclesLoading(false))
  }, [])

  const filteredCircles = circles.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreateCircle() {
    setCreateError(null)
    if (!circleName.trim()) { setCreateError("Please give your circle a name."); return }
    setCreateLoading(true)

    const response = await fetch("/api/circle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: circleName.trim(), description: description.trim() }),
    })

    const data = (await response.json()) as {
      error?: string
      inviteCode?: string | null
      room?: { id: string } | null
    }

    if (!response.ok || !data.room?.id) {
      setCreateError(data.error ?? "We couldn't create your circle.")
      setCreateLoading(false)
      return
    }

    session.setRoomId(data.room.id)
    setCreatedRoomId(data.room.id)
    setCreatedInviteCode(data.inviteCode ?? null)
    setCreateLoading(false)
  }

  async function handleJoinCircle(roomId: string) {
    setJoinError(null)
    setJoiningId(roomId)

    const response = await fetch("/api/circle/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId }),
    })

    const data = (await response.json()) as { error?: string; roomId?: string }

    if (!response.ok) {
      setJoinError(data.error ?? "Could not join circle.")
      setJoiningId(null)
      return
    }

    session.setRoomId(roomId)
    router.push("/circle")
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.65rem 1rem',
    background: 'var(--glass-strong)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.9rem',
    lineHeight: 1.5,
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', color: 'var(--text)', padding: '2rem 1rem' }}>

      {/* Ambient glow */}
      <div aria-hidden="true" style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse 50% 40% at 50% 0%, rgba(201,168,76,0.08), transparent)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, margin: '0 auto', maxWidth: '960px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Hero header */}
        <div style={{ textAlign: 'center', paddingTop: '1rem' }}>
          <span className="muted-kicker" style={{ justifyContent: 'center', marginBottom: '1rem', display: 'flex' }}>
            Circle Onboarding
          </span>
          <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.75rem)', fontWeight: 700, letterSpacing: '-0.04em', marginBottom: '0.75rem' }}>
            Start or join your daily study circle
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', maxWidth: '40ch', margin: '0 auto', lineHeight: 1.75 }}>
            Every day, the same ayah. The same five lenses. The same companions returning with you.
          </p>
        </div>

        {/* Two panels */}
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>

          {/* Create */}
          <section className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--gold)',
                display: 'block',
                marginBottom: '0.5rem',
              }}>
                Option A
              </span>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.35rem' }}>
                Create a Circle
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.65 }}>
                Start your own circle. Others on Al-Habl can find and join it.
              </p>
            </div>

            <div className="divider" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <input
                style={inputStyle}
                placeholder="Circle name e.g. Morning Brothers"
                value={circleName}
                onChange={e => setCircleName(e.target.value)}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--gold-border)'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px var(--gold-dim)' }}
                onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--glass-border)'; (e.target as HTMLInputElement).style.boxShadow = 'none' }}
              />
              <textarea
                style={{ ...inputStyle, minHeight: '80px', resize: 'none' }}
                placeholder="Description (optional)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--gold-border)'; (e.target as HTMLTextAreaElement).style.boxShadow = '0 0 0 3px var(--gold-dim)' }}
                onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--glass-border)'; (e.target as HTMLTextAreaElement).style.boxShadow = 'none' }}
              />
            </div>

            {createError && (
              <div style={{
                padding: '0.65rem 0.875rem',
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.18)',
                borderRadius: 'var(--radius-sm)',
                color: '#f87171',
                fontSize: '0.85rem',
                lineHeight: 1.5,
              }}>
                {createError}
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleCreateCircle()}
              disabled={createLoading}
              className="button-primary"
              style={{ width: '100%', padding: '0.75rem' }}
            >
              {createLoading ? "Creating…" : "Create Circle →"}
            </button>
          </section>

          {/* Join */}
          <section className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--gold)',
                display: 'block',
                marginBottom: '0.5rem',
              }}>
                Option B
              </span>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.35rem' }}>
                Join a Circle
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.65 }}>
                Browse circles created by Al-Habl users and join one.
              </p>
            </div>

            <div className="divider" />

            <div style={{ position: 'relative' }}>
              <input
                style={{ ...inputStyle, paddingRight: '2.5rem' }}
                placeholder="Search by name…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--gold-border)'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px var(--gold-dim)' }}
                onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--glass-border)'; (e.target as HTMLInputElement).style.boxShadow = 'none' }}
              />
              <svg style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </div>

            {joinError && (
              <div style={{
                padding: '0.65rem 0.875rem',
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.18)',
                borderRadius: 'var(--radius-sm)',
                color: '#f87171',
                fontSize: '0.85rem',
              }}>
                {joinError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }} className="scrollbar-none">
              {circlesLoading ? (
                [0,1,2].map(i => (
                  <div key={i} className="skeleton" style={{ height: '60px', borderRadius: 'var(--radius-md)' }} />
                ))
              ) : filteredCircles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--muted)', fontSize: '0.875rem' }}>
                  {circles.length === 0
                    ? "No circles yet — be the first to create one."
                    : `No circles match "${search}"`}
                </div>
              ) : (
                filteredCircles.map(circle => (
                  <div
                    key={circle.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: 'var(--glass)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-md)',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--text)', marginBottom: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {circle.name}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        {circle.member_count} {circle.member_count === 1 ? "member" : "members"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleJoinCircle(circle.id)}
                      disabled={joiningId === circle.id}
                      style={{
                        flexShrink: 0,
                        padding: '0.4rem 0.875rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--gold-border)',
                        background: 'var(--gold-dim)',
                        color: 'var(--gold)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        opacity: joiningId === circle.id ? 0.5 : 1,
                      }}
                      onMouseEnter={e => {
                        if (joiningId !== circle.id) {
                          (e.currentTarget as HTMLButtonElement).style.background = 'var(--gold)';
                          (e.currentTarget as HTMLButtonElement).style.color = '#0F0E0C';
                        }
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--gold-dim)';
                        (e.currentTarget as HTMLButtonElement).style.color = 'var(--gold)';
                      }}
                    >
                      {joiningId === circle.id ? "Joining…" : "Join"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Success sheet */}
      {createdInviteCode && (
        <>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setCreatedInviteCode(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', cursor: 'pointer', border: 'none' }}
          />
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            margin: '0 auto',
            maxWidth: '32rem',
            borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
            borderTop: '1px solid var(--glass-border)',
            background: 'var(--ink-raised)',
            padding: '1.5rem 1.5rem 2.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            boxShadow: '0 -12px 40px rgba(0,0,0,0.3)',
          }}>
            {/* Drag handle */}
            <div style={{ width: '40px', height: '4px', borderRadius: '99px', background: 'var(--glass-border)', margin: '0 auto' }} />

            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.35rem' }}>
                Your circle is ready ✓
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.65 }}>
                Others can find and join your circle from the onboarding screen.
              </p>
            </div>

            <div style={{
              padding: '1rem',
              background: 'var(--gold-dim)',
              border: '1px solid var(--gold-border)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '0.4rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Invite code
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--gold)', fontWeight: 600, wordBreak: 'break-all', letterSpacing: '0.05em' }}>
                {createdInviteCode}
              </p>
            </div>

            <button
              type="button"
              className="button-primary"
              style={{ width: '100%', padding: '0.8rem' }}
              onClick={() => {
                if (createdRoomId) session.setRoomId(createdRoomId)
                router.push("/circle")
              }}
            >
              Continue to your circle →
            </button>
          </div>
        </>
      )}
    </div>
  )
}