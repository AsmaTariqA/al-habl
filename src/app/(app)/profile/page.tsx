"use client"

import { useEffect, useMemo, useState } from "react"
import { AppShell } from "@/components/circle/AppShell"
import { ThemeToggle } from "@/components/theme/ThemeToggle"
import { getClientAccessToken } from "@/lib/client-access"
import {
  createGoal, getActivityDays, getBookmarks, getCollections,
  getGoals, getNotes, getRoomPosts, getStreaks, getUserProfile, getUserRooms,
} from "@/lib/qf-api"
import { session } from "@/lib/session"
import type { Goal, UserProfile, UserStreak } from "@/types/circle"

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")
}

function getLastThirtyDays() {
  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - index))
    return date.toISOString().slice(0, 10)
  })
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [streak, setStreak] = useState<UserStreak | null>(null)
  const [streakFailed, setStreakFailed] = useState(false)
  const [activityDays, setActivityDays] = useState<string[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [bookmarksCount, setBookmarksCount] = useState(0)
  const [bookmarksFailed, setBookmarksFailed] = useState(false)
  const [collectionsCount, setCollectionsCount] = useState(0)
  const [collectionsFailed, setCollectionsFailed] = useState(false)
  const [notesCount, setNotesCount] = useState(0)
  const [notesFailed, setNotesFailed] = useState(false)
  const [monthlyReflections, setMonthlyReflections] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [goalType, setGoalType] = useState("Read 1 verse daily")
  const [goalTarget, setGoalTarget] = useState(7)
  const [goalLoading, setGoalLoading] = useState(false)

  const heatmapDays = useMemo(() => getLastThirtyDays(), [])

  useEffect(() => {
    const loadProfile = async () => {
      const token = await getClientAccessToken()
      if (!token) { setError("We couldn't verify your session."); setLoading(false); return }

      const [profileData, streakData, activityData, goalsData, bookmarks, collections, notes, rooms] = await Promise.all([
        getUserProfile(token).catch(() => null),
        getStreaks(token).catch(() => { setStreakFailed(true); return null }),
        getActivityDays(token).catch(() => null),
        getGoals(token).catch(() => null),
        getBookmarks(token).catch(() => { setBookmarksFailed(true); return null }),
        getCollections(token).catch(() => { setCollectionsFailed(true); return null }),
        getNotes(token).catch(() => { setNotesFailed(true); return null }),
        getUserRooms(token).catch(() => null),
      ])

      const currentMonthKey = new Date().toISOString().slice(0, 7)
      const roomPosts = await Promise.all((rooms ?? []).map((room) => getRoomPosts(token, room.id)))
      const userId = session.getUserId()
      const reflectionCount = roomPosts.flatMap((items) => items ?? [])
        .filter((post) => post.user_id === userId && post.created_at.startsWith(currentMonthKey)).length

      setProfile(profileData)
      setStreak(streakData)
      setActivityDays((activityData ?? []).filter((entry) => entry.active).map((entry) => entry.date))
      setGoals(goalsData ?? [])
      setBookmarksCount(bookmarks?.length ?? 0)
      setCollectionsCount(collections?.length ?? 0)
      setNotesCount(notes?.length ?? 0)
      setMonthlyReflections(reflectionCount)
      setLoading(false)
    }
    void loadProfile()
  }, [])

  async function handleCreateGoal() {
    setGoalLoading(true)
    const token = await getClientAccessToken()
    if (!token) { setGoalLoading(false); return }
    const goal = await createGoal(token, goalType, goalTarget)
    if (goal) setGoals((current) => [goal, ...current])
    setGoalLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.65rem 1rem',
    background: 'var(--glass-strong)', border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)', color: 'var(--text)',
    fontFamily: 'var(--font-sans)', fontSize: '0.9rem', lineHeight: 1.5,
    outline: 'none', transition: 'border-color 0.15s ease',
  }

  return (
    <AppShell pageLabel="Profile">
      <main style={{ margin: '0 auto', width: '100%', maxWidth: '64rem', padding: '2rem 1rem 6rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Header */}
        <section className="glass-card" style={{ padding: '1.75rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <span className="muted-kicker" style={{ display: 'flex' }}>Profile</span>
            <ThemeToggle />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.75rem' }}>
            <div style={{ width: '60px', height: '60px', flexShrink: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, background: 'var(--gold-dim2)', border: '1px solid var(--gold-border)', color: 'var(--gold)' }}>
              {getInitials(profile?.username ?? "U")}
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 700, letterSpacing: '-0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {loading ? <div className="skeleton" style={{ height: '1.75rem', width: '180px', borderRadius: 'var(--radius-sm)' }} /> : (profile?.username ?? "Quran Circle Member")}
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{profile?.quran_account_tag ?? "Quran.com account"}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ padding: '1.25rem', background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', borderRadius: 'var(--radius-md)' }}>
              <span className="muted-kicker" style={{ display: 'flex', marginBottom: '0.75rem' }}>Current Streak</span>
              <p style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--gold)', lineHeight: 1 }}>{loading ? "–" : streakFailed ? "—" : streak?.current_streak ?? "0"}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.4rem' }}>days in a row</p>
            </div>
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <span className="muted-kicker" style={{ display: 'flex', marginBottom: '0.75rem' }}>Best Streak</span>
              <p style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 }}>{loading ? "–" : streakFailed ? "—" : streak?.max_streak ?? "0"}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.4rem' }}>personal best</p>
            </div>
          </div>
        </section>

        {/* Activity */}
        <section className="glass-card" style={{ padding: '1.5rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <span className="muted-kicker" style={{ display: 'flex', marginBottom: '0.35rem' }}>Activity</span>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Last 30 days</p>
            </div>
            {error && <p style={{ fontSize: '0.75rem', color: '#f87171', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>{error}</p>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '6px' }}>
            {heatmapDays.map((day) => {
              const active = activityDays.includes(day)
              return (
                <div key={day} title={day} style={{ aspectRatio: '1', borderRadius: '5px', background: active ? 'var(--gold)' : 'var(--glass-strong)', border: `1px solid ${active ? 'var(--gold-border)' : 'var(--glass-border)'}`, boxShadow: active ? '0 0 6px rgba(201,168,76,0.3)' : 'none', transition: 'all 0.15s ease' }} />
              )
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.875rem', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Less</span>
            {[0.15, 0.35, 0.6, 0.8, 1].map((o, i) => (
              <div key={i} style={{ width: '10px', height: '10px', borderRadius: '3px', background: i === 4 ? 'var(--gold)' : `color-mix(in srgb, var(--gold) ${Math.round(o * 100)}%, var(--glass-strong))`, border: '1px solid var(--glass-border)' }} />
            ))}
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>More</span>
          </div>
        </section>

        {/* Goals */}
        <section className="glass-card" style={{ padding: '1.5rem 2rem' }}>
          <span className="muted-kicker" style={{ display: 'flex', marginBottom: '0.35rem' }}>Goals</span>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1.25rem' }}>Track your rhythm</p>
          {goals.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {goals.map((goal) => {
                const progress = goal.target > 0 ? Math.min((goal.progress / goal.target) * 100, 100) : 0
                return (
                  <div key={goal.id} style={{ padding: '1rem', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>{goal.type}</p>
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{goal.progress}/{goal.target}</span>
                    </div>
                    <div style={{ height: '5px', borderRadius: '99px', background: 'var(--glass-strong)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progress}%`, background: 'var(--gold)', borderRadius: '99px', transition: 'width 0.4s var(--ease-out-expo)', opacity: progress >= 100 ? 1 : 0.75 }} />
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.4rem', textAlign: 'right' }}>{Math.round(progress)}%</p>
                  </div>
                )
              })}
            </div>
          )}
          <div style={{ padding: '1.25rem', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text)' }}>Create new goal</p>
            <input style={inputStyle} value={goalType} onChange={(e) => setGoalType(e.target.value)} placeholder="e.g. Read 1 verse daily" onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--gold-border)'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'var(--glass-border)'} />
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input style={{ ...inputStyle, width: 'auto', minWidth: '80px', flex: '0 0 auto' }} type="number" min={1} value={goalTarget} onChange={(e) => setGoalTarget(Number(e.target.value))} onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--gold-border)'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'var(--glass-border)'} />
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>days target</p>
            </div>
            <button className="button-primary" onClick={() => void handleCreateGoal()} disabled={goalLoading} style={{ width: '100%' }}>
              {goalLoading ? "Saving…" : "Create Goal"}
            </button>
          </div>
        </section>

        {/* Stats */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }} className="sm:!grid-cols-4">
          {[
            { label: 'Bookmarks',   value: bookmarksFailed   ? '—' : bookmarksCount,   href: '/circle/archive#bookmarks'   },
            { label: 'Collections', value: collectionsFailed ? '—' : collectionsCount, href: '/circle/archive#collections' },
            { label: 'Notes',       value: notesFailed       ? '—' : notesCount,       href: '/circle/archive#notes'       },
            { label: 'This Month',  value: monthlyReflections,                          href: undefined                     },
          ].map(({ label, value, href }) => {
            const El = href ? 'a' : 'div'
            return (
              <El key={label} href={href} className="glass-card" style={{ display: 'block', padding: '1.25rem', textDecoration: 'none', cursor: href ? 'pointer' : 'default' }}>
                <span className="muted-kicker" style={{ display: 'flex', marginBottom: '0.65rem' }}>{label}</span>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {loading ? <span className="skeleton" style={{ display: 'inline-block', width: '2rem', height: '1.75rem', borderRadius: 'var(--radius-sm)' }} /> : value}
                </p>
              </El>
            )
          })}
        </section>

      </main>
    </AppShell>
  )
}