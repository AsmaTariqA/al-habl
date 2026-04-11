"use client"

import { useEffect, useMemo, useState } from "react"
import { BottomNavigation } from "@/components/circle/BottomNavigation"
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
  const [activityDays, setActivityDays] = useState<string[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [bookmarksCount, setBookmarksCount] = useState(0)
  const [collectionsCount, setCollectionsCount] = useState(0)
  const [notesCount, setNotesCount] = useState(0)
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
        getUserProfile(token),
        getStreaks(token),
        getActivityDays(token),
        getGoals(token),
        getBookmarks(token),
        getCollections(token),
        getNotes(token),
        getUserRooms(token),
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
      <main className="circle-shell space-y-4 pt-6">
        <section className="glass-card space-y-6 overflow-hidden p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <p className="muted-kicker">Profile</p>
            <ThemeToggle />
          </div>
          <div className="rounded-[22px] border border-[var(--gold-border)] bg-[linear-gradient(135deg,rgba(201,168,76,0.16),rgba(255,255,255,0.03))] p-4 sm:p-5">
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--gold-dim)] text-lg font-medium text-[var(--gold)]">
                {getInitials(profile?.username ?? "User")}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold sm:text-3xl">{profile?.username ?? "Quran Circle Member"}</h1>
                <p className="mt-1 text-sm text-[var(--muted)]">{profile?.quran_account_tag ?? "Quran.com account"}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[20px] border border-[var(--gold-border)] bg-[var(--gold-dim)] p-4">
              <p className="muted-kicker">Current Streak</p>
              <p className="mt-3 text-4xl font-semibold text-[var(--gold)]">{loading ? "--" : streak?.current_streak ?? 0}</p>
            </div>
            <div className="glass-card p-4">
              <p className="muted-kicker">Max Streak</p>
              <p className="mt-3 text-4xl font-semibold">{loading ? "--" : streak?.max_streak ?? 0}</p>
            </div>
          </div>
        </section>

        <section className="glass-card space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="muted-kicker">Activity Calendar</p>
              <p className="section-subcopy">Last 30 days of presence.</p>
            </div>
            {error ? <p className="text-xs text-[#f0a7a0]">{error}</p> : null}
          </div>
          <div className="grid grid-cols-10 gap-2">
            {heatmapDays.map((day) => {
              const active = activityDays.includes(day)
              return (
                <div
                  key={day}
                  title={day}
                  className={`aspect-square rounded-[10px] border ${
                    active ? "border-[var(--gold-border)] bg-[var(--gold)]" : "border-white/8 bg-white/4"
                  }`}
                />
              )
            })}
          </div>
        </section>

        <section className="glass-card space-y-4 p-5 sm:p-6">
          <div>
            <p className="muted-kicker">Goals</p>
            <p className="section-subcopy">Keep your rhythm visible and measurable.</p>
          </div>
          <div className="space-y-3">
            {goals.map((goal) => {
              const progress = goal.target > 0 ? Math.min((goal.progress / goal.target) * 100, 100) : 0
              return (
                <div key={goal.id} className="rounded-[18px] border border-white/8 bg-white/4 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm">{goal.type}</p>
                    <p className="text-xs text-[var(--muted)]">{goal.progress}/{goal.target}</p>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/8">
                    <div className="h-full rounded-full bg-[var(--gold)]" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="rounded-[18px] border border-white/8 bg-white/4 p-4">
            <p className="text-sm font-medium">Create new goal</p>
            <div className="mt-3 space-y-3">
              <input className="input-field" value={goalType} onChange={(event) => setGoalType(event.target.value)} />
              <input className="input-field" type="number" min={1} value={goalTarget} onChange={(event) => setGoalTarget(Number(event.target.value))} />
              <button type="button" className="button-primary w-full" onClick={() => void handleCreateGoal()} disabled={goalLoading}>{goalLoading ? "Saving..." : "Create Goal"}</button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <a href="/circle/archive#bookmarks" className="glass-card space-y-2 p-4"><p className="muted-kicker">Bookmarks</p><p className="text-3xl font-semibold">{bookmarksCount}</p><p className="text-xs text-[var(--muted)]">View bookmarks</p></a>
          <a href="/circle/archive#collections" className="glass-card space-y-2 p-4"><p className="muted-kicker">Collections</p><p className="text-3xl font-semibold">{collectionsCount}</p><p className="text-xs text-[var(--muted)]">View collections</p></a>
          <a href="/circle/archive#notes" className="glass-card space-y-2 p-4"><p className="muted-kicker">Notes</p><p className="text-3xl font-semibold">{notesCount}</p><p className="text-xs text-[var(--muted)]">View notes</p></a>
          <div className="glass-card space-y-2 p-4"><p className="muted-kicker">This Month</p><p className="text-3xl font-semibold">{monthlyReflections}</p><p className="text-xs text-[var(--muted)]">Reflections posted</p></div>
        </section>
      </main>
      <BottomNavigation />
    </div>
  )
}


