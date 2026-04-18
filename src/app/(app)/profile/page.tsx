"use client"

import { useEffect, useMemo, useState } from "react"
import { BottomNavigation } from "@/components/circle/BottomNavigation"
import { SidebarNav } from "@/components/circle/SidebarNav"
import { ThemeToggle } from "@/components/theme/ThemeToggle"
import { getClientAccessToken } from "@/lib/client-access"
import {
  createGoal,
  getActivityDays,
  getBookmarks,
  getCollections,
  getGoals,
  getNotes,
  getRoomPosts,
  getStreaks,
  getUserProfile,
  getUserRooms,
} from "@/lib/qf-api"
import { session } from "@/lib/session"
import type { Goal, UserProfile, UserStreak } from "@/types/circle"

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

function getLastTwentyDays() {
  return Array.from({ length: 20 }, (_, index) => {
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

  const heatmapDays = useMemo(() => getLastTwentyDays(), [])

  useEffect(() => {
    const loadProfile = async () => {
      const token = await getClientAccessToken()
      if (!token) {
        setError("We couldn't verify your session.")
        setLoading(false)
        return
      }

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

      const reflectionCount = roomPosts
        .flatMap((items) => items ?? [])
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
    if (!token) {
      setGoalLoading(false)
      return
    }
    const goal = await createGoal(token, goalType, goalTarget)
    if (goal) setGoals((current) => [goal, ...current])
    setGoalLoading(false)
  }

  return (
    <div className="min-h-screen bg-[var(--ink)] pb-24 text-[var(--text)]">
      <aside className="hidden lg:flex fixed left-0 top-0 z-30 h-full w-60 flex-col border-r border-white/6 bg-[rgba(15,14,12,0.8)] p-4 backdrop-blur-xl">
        <div className="mb-8 px-2">
          <p className="text-sm font-bold tracking-[0.2em] text-[var(--gold)] uppercase">Al-Habl</p>
          <p className="mt-0.5 text-xs text-[var(--muted)]">Profile</p>
        </div>
        <SidebarNav />
      </aside>

      <main className="mx-auto w-full max-w-5xl px-4 pt-8 space-y-6 lg:pl-60">

        {/* Header */}
        <section className="glass-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <p className="muted-kicker">Profile</p>
            <ThemeToggle />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--gold-dim)] text-lg font-medium text-[var(--gold)]">
              {getInitials(profile?.username ?? "User")}
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold truncate">
                {profile?.username ?? "Quran Circle Member"}
              </h1>
              <p className="text-sm text-[var(--muted)] mt-1">
                {profile?.quran_account_tag ?? "Quran.com account"}
              </p>
            </div>
          </div>

          {/* Streaks */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-dim)] p-5">
              <p className="muted-kicker">Current Streak</p>
              <p className="mt-3 text-4xl font-semibold text-[var(--gold)]">
                {loading ? "--" : streakFailed ? "—" : streak?.current_streak ?? "—"}
              </p>
            </div>

            <div className="glass-card p-5">
              <p className="muted-kicker">Max Streak</p>
              <p className="mt-3 text-4xl font-semibold">
                {loading ? "--" : streakFailed ? "—" : streak?.max_streak ?? "—"}
              </p>
            </div>
          </div>
        </section>

        {/* Activity */}
        <section className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="muted-kicker">Activity</p>
              <p className="section-subcopy">Last 30 days</p>
            </div>
            {error && <p className="text-xs text-[#f0a7a0]">{error}</p>}
          </div>

          <div className="grid grid-cols-10 gap-2">
            {heatmapDays.map((day) => {
              const active = activityDays.includes(day)
              return (
                <div
                  key={day}
                  className={`aspect-square rounded-md border transition ${
                    active
                      ? "bg-[var(--gold)] border-[var(--gold-border)]"
                      : "bg-white/4 border-white/8"
                  }`}
                />
              )
            })}
          </div>
        </section>

        {/* Goals */}
        <section className="glass-card p-6 space-y-5">
          <div>
            <p className="muted-kicker">Goals</p>
            <p className="section-subcopy">Track your rhythm</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {goals.map((goal) => {
              const progress = goal.target > 0 ? Math.min((goal.progress / goal.target) * 100, 100) : 0
              return (
                <div key={goal.id} className="rounded-2xl border border-white/8 bg-white/4 p-4">
                  <div className="flex justify-between text-sm">
                    <p>{goal.type}</p>
                    <p className="text-[var(--muted)]">{goal.progress}/{goal.target}</p>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/8">
                    <div className="h-full bg-[var(--gold)] rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/4 p-4 space-y-3">
            <p className="text-sm font-medium">Create new goal</p>
            <input className="input-field" value={goalType} onChange={(e) => setGoalType(e.target.value)} />
            <input className="input-field" type="number" min={1} value={goalTarget} onChange={(e) => setGoalTarget(Number(e.target.value))} />
            <button
              className="button-primary w-full"
              onClick={() => void handleCreateGoal()}
              disabled={goalLoading}
            >
              {goalLoading ? "Saving..." : "Create Goal"}
            </button>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <a href="/circle/archive#bookmarks" className="glass-card p-4 space-y-1">
            <p className="muted-kicker">Bookmarks</p>
            <p className="text-2xl font-semibold">{bookmarksFailed ? "—" : bookmarksCount}</p>
          </a>

          <a href="/circle/archive#collections" className="glass-card p-4 space-y-1">
            <p className="muted-kicker">Collections</p>
            <p className="text-2xl font-semibold">{collectionsFailed ? "—" : collectionsCount}</p>
          </a>

          <a href="/circle/archive#notes" className="glass-card p-4 space-y-1">
            <p className="muted-kicker">Notes</p>
            <p className="text-2xl font-semibold">{notesFailed ? "—" : notesCount}</p>
          </a>

          <div className="glass-card p-4 space-y-1">
            <p className="muted-kicker">This Month</p>
            <p className="text-2xl font-semibold">{monthlyReflections}</p>
          </div>
        </section>

      </main>

      <div className="lg:hidden">
        <BottomNavigation />
      </div>
    </div>
  )
}
