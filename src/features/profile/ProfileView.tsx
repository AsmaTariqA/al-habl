"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import Link from "next/link"
import { AppShell } from "@/components/circle/AppShell"
import { ThemeToggle } from "@/components/theme/ThemeToggle"
import { useQfProfileQuery } from "@/hooks/qf/useQfProfile"
import { useQfStreaksQuery } from "@/hooks/qf/useQfStreaks"
import { getClientAccessToken } from "@/lib/client-access"
import { qfKeys } from "@/lib/qf/queryKeys"
import {
  qfProfileExtrasQueryFn,
  type ProfileExtrasResult,
} from "@/lib/qf/queryFns"
import { createGoal } from "@/lib/qf-api"
import { session } from "@/lib/session"

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

export function ProfileView() {
  const queryClient = useQueryClient()
  const [goalType, setGoalType] = useState("Read 1 verse daily")
  const [goalTarget, setGoalTarget] = useState(7)
  const [switchingCircleId, setSwitchingCircleId] = useState<string | null>(null)

  const profileQ = useQfProfileQuery()
  const streakQ = useQfStreaksQuery()

  const extrasQ = useQuery({
    queryKey: qfKeys.profileExtras(),
    queryFn: qfProfileExtrasQueryFn,
    staleTime: 90_000,
  })

  const profile = profileQ.data ?? null
  const streak = streakQ.data ?? null

  const activityDates = useMemo(
    () =>
      (extrasQ.data?.activityDays ?? [])
        .filter((entry) => entry.active)
        .map((entry) => entry.date),
    [extrasQ.data],
  )

  const goals = extrasQ.data?.goals ?? []
  const rooms = extrasQ.data?.rooms ?? []
  const currentRoomId = session.getRoomId()
  const currentRoom = rooms.find((r) => r.id === currentRoomId)
  const bookmarksCount = extrasQ.data?.bookmarks?.length ?? 0
  const collectionsCount = extrasQ.data?.collections?.length ?? 0
  const notesCount = extrasQ.data?.notes?.length ?? 0
  const monthlyReflections = extrasQ.data?.monthlyReflections ?? 0

  const heatmapDays = useMemo(() => getLastThirtyDays(), [])

  const loading =
    profileQ.isPending || streakQ.isPending || extrasQ.isPending

  const streakFailed = streakQ.isError
  const bookmarksFailed = extrasQ.isError
  const collectionsFailed = extrasQ.isError
  const notesFailed = extrasQ.isError

  const error =
    profileQ.isError ? "We couldn't load part of your profile." : null

  const createGoalMutation = useMutation({
    mutationFn: async () => {
      const token = await getClientAccessToken()
      if (!token) return null
      return createGoal(token, goalType, goalTarget)
    },
    onSuccess: (goal) => {
      if (!goal) return
      queryClient.setQueryData<ProfileExtrasResult | null>(
        qfKeys.profileExtras(),
        (old) => {
          const base = old ?? {
            activityDays: [],
            goals: [],
            bookmarks: [],
            collections: [],
            notes: [],
            rooms: [],
            totalReflections: 0,
            monthlyReflections: 0,
          }
          return { ...base, goals: [goal, ...base.goals] }
        },
      )
    },
  })

  const switchCircleMutation = useMutation({
    mutationFn: async (roomId: string) => {
      session.setRoomId(roomId)
      // Navigate to circle after switching
      window.location.href = "/circle"
    },
  })

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.65rem 1rem",
    background: "var(--glass-strong)",
    border: "1px solid var(--glass-border)",
    borderRadius: "var(--radius-md)",
    color: "var(--text)",
    fontFamily: "var(--font-sans)",
    fontSize: "0.9rem",
    lineHeight: 1.5,
    outline: "none",
    transition: "border-color 0.15s ease",
  }

  return (
    <AppShell pageLabel="Profile">
      <main
        style={{
          margin: "0 auto",
          width: "100%",
          maxWidth: "64rem",
          padding: "2rem 1rem 6rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >

        <section className="glass-card" style={{ padding: "1.75rem 2rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <span className="muted-kicker" style={{ display: "flex" }}>Profile</span>
            <ThemeToggle />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.75rem" }}>
            <div style={{ width: "60px", height: "60px", flexShrink: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: 700, background: "var(--gold-dim2)", border: "1px solid var(--gold-border)", color: "var(--gold)" }}>
              {getInitials(profile?.username ?? "U")}
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: "clamp(1.4rem, 4vw, 2rem)", fontWeight: 700, letterSpacing: "-0.04em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {loading ? <div className="skeleton" style={{ height: "1.75rem", width: "180px", borderRadius: "var(--radius-sm)" }} /> : (profile?.username ?? "Quran Circle Member")}
              </h1>
              <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "0.25rem" }}>{profile?.quran_account_tag ?? "Quran.com account"}</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ padding: "1.25rem", background: "var(--gold-dim)", border: "1px solid var(--gold-border)", borderRadius: "var(--radius-md)" }}>
              <span className="muted-kicker" style={{ display: "flex", marginBottom: "0.75rem" }}>Current Streak</span>
              <p style={{ fontSize: "2.5rem", fontWeight: 700, letterSpacing: "-0.04em", color: "var(--gold)", lineHeight: 1 }}>{loading ? "–" : streakFailed ? "—" : streak?.current_streak ?? "0"}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.4rem" }}>days in a row</p>
            </div>
            <div className="glass-card" style={{ padding: "1.25rem" }}>
              <span className="muted-kicker" style={{ display: "flex", marginBottom: "0.75rem" }}>Best Streak</span>
              <p style={{ fontSize: "2.5rem", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1 }}>{loading ? "–" : streakFailed ? "—" : streak?.max_streak ?? "0"}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.4rem" }}>personal best</p>
            </div>
          </div>
        </section>

        {/* Current Circle Section — Feature 4 */}
        {currentRoom && (
          <section className="glass-card" style={{ padding: "1.5rem 2rem" }}>
            <span className="muted-kicker" style={{ display: "flex", marginBottom: "0.35rem" }}>Current Circle</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1.5rem", alignItems: "start", marginTop: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem", letterSpacing: "-0.01em" }}>{currentRoom.name}</h3>
                {currentRoom.description && (
                  <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "1rem", lineHeight: 1.5 }}>{currentRoom.description}</p>
                )}
                <div style={{ display: "flex", gap: "2rem", marginTop: "1rem" }}>
                  <div>
                    <span className="muted-kicker" style={{ display: "flex", marginBottom: "0.35rem", fontSize: "0.75rem" }}>Members</span>
                    <p style={{ fontSize: "1.5rem", fontWeight: 600 }}>{currentRoom.member_count}</p>
                  </div>
                  {currentRoom.invite_code && (
                    <div>
                      <span className="muted-kicker" style={{ display: "flex", marginBottom: "0.35rem", fontSize: "0.75rem" }}>Invite Code</span>
                      <p style={{ fontSize: "1rem", fontWeight: 600, fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>{currentRoom.invite_code}</p>
                    </div>
                  )}
                </div>
              </div>
              <Link href="/circle" className="button-primary" style={{ display: "block", padding: "0.65rem 1.25rem", textDecoration: "none", width: "auto", whiteSpace: "nowrap", marginTop: "0.5rem" }}>
                Go to Circle
              </Link>
            </div>
          </section>
        )}

        <section className="glass-card" style={{ padding: "1.5rem 2rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <div>
              <span className="muted-kicker" style={{ display: "flex", marginBottom: "0.35rem" }}>Activity</span>
              <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>Last 30 days</p>
            </div>
            {error && <p style={{ fontSize: "0.75rem", color: "#f87171", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)", padding: "0.3rem 0.6rem", borderRadius: "var(--radius-sm)" }}>{error}</p>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "6px" }}>
            {heatmapDays.map((day) => {
              const active = activityDates.includes(day)
              return (
                <div key={day} title={day} style={{ aspectRatio: "1", borderRadius: "5px", background: active ? "var(--gold)" : "var(--glass-strong)", border: `1px solid ${active ? "var(--gold-border)" : "var(--glass-border)"}`, boxShadow: active ? "0 0 6px rgba(201,168,76,0.3)" : "none", transition: "all 0.15s ease" }} />
              )
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.875rem", justifyContent: "flex-end" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Less</span>
            {[0.15, 0.35, 0.6, 0.8, 1].map((o, i) => (
              <div key={`h-${String(i)}`} style={{ width: "10px", height: "10px", borderRadius: "3px", background: i === 4 ? "var(--gold)" : `color-mix(in srgb, var(--gold) ${Math.round(o * 100)}%, var(--glass-strong))`, border: "1px solid var(--glass-border)" }} />
            ))}
            <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>More</span>
          </div>
        </section>

        <section className="glass-card" style={{ padding: "1.5rem 2rem" }}>
          <span className="muted-kicker" style={{ display: "flex", marginBottom: "0.35rem" }}>Goals</span>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "1.25rem" }}>Track your rhythm</p>
          {goals.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
              {goals.map((goal) => {
                const progress = goal.target > 0 ? Math.min((goal.progress / goal.target) * 100, 100) : 0
                return (
                  <div key={goal.id} style={{ padding: "1rem", background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-md)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", gap: "0.5rem" }}>
                      <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text)", lineHeight: 1.4 }}>{goal.type}</p>
                      <span style={{ fontSize: "0.72rem", color: "var(--muted)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>{goal.progress}/{goal.target}</span>
                    </div>
                    <div style={{ height: "5px", borderRadius: "99px", background: "var(--glass-strong)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${progress}%`, background: "var(--gold)", borderRadius: "99px", transition: "width 0.4s var(--ease-out-expo)", opacity: progress >= 100 ? 1 : 0.75 }} />
                    </div>
                    <p style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.4rem", textAlign: "right" }}>{Math.round(progress)}%</p>
                  </div>
                )
              })}
            </div>
          )}
          <div style={{ padding: "1.25rem", background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--text)" }}>Create new goal</p>
            <input style={inputStyle} value={goalType} onChange={(e) => setGoalType(e.target.value)} placeholder="e.g. Read 1 verse daily" onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--gold-border)" }} onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--glass-border)" }} />
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input style={{ ...inputStyle, width: "auto", minWidth: "80px", flex: "0 0 auto" }} type="number" min={1} value={goalTarget} onChange={(e) => setGoalTarget(Number(e.target.value))} onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--gold-border)" }} onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--glass-border)" }} />
              <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>days target</p>
            </div>
            <button className="button-primary" onClick={() => void createGoalMutation.mutate()} disabled={createGoalMutation.isPending} style={{ width: "100%" }}>
              {createGoalMutation.isPending ? "Saving…" : "Create Goal"}
            </button>
          </div>
        </section>

        {/* My Circles Section — Feature 2 */}
        {rooms.length > 0 && (
          <section className="glass-card" style={{ padding: "1.5rem 2rem" }}>
            <span className="muted-kicker" style={{ display: "flex", marginBottom: "0.35rem" }}>My Circles</span>
            <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "1.25rem" }}>Circles you've created or joined</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
              {rooms.map((room) => {
                const isCurrentRoom = room.id === currentRoomId
                return (
                  <div key={room.id} style={{ padding: "1.25rem", background: isCurrentRoom ? "var(--gold-dim)" : "var(--glass)", border: `1px solid ${isCurrentRoom ? "var(--gold-border)" : "var(--glass-border)"}`, borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <h4 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{room.name}</h4>
                        {isCurrentRoom && <span style={{ fontSize: "0.65rem", padding: "0.25rem 0.5rem", background: "var(--gold)", color: "var(--dark)", fontWeight: 600, borderRadius: "var(--radius-sm)", flexShrink: 0 }}>Active</span>}
                      </div>
                      {room.description && (
                        <p style={{ fontSize: "0.8rem", color: "var(--muted)", lineHeight: 1.4, marginBottom: "0.75rem" }}>{room.description}</p>
                      )}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                        <div>
                          <span className="muted-kicker" style={{ display: "flex", marginBottom: "0.3rem", fontSize: "0.7rem" }}>Members</span>
                          <p style={{ fontSize: "1.25rem", fontWeight: 600 }}>{room.member_count}</p>
                        </div>
                        {room.invite_code && (
                          <div>
                            <span className="muted-kicker" style={{ display: "flex", marginBottom: "0.3rem", fontSize: "0.7rem" }}>Code</span>
                            <p style={{ fontSize: "0.875rem", fontWeight: 600, fontFamily: "var(--font-mono)" }}>{room.invite_code}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {!isCurrentRoom && (
                      <button
                        className="button-primary"
                        onClick={() => {
                          setSwitchingCircleId(room.id)
                          void switchCircleMutation.mutate(room.id)
                        }}
                        disabled={switchCircleMutation.isPending || switchingCircleId === room.id}
                        style={{ width: "100%", fontSize: "0.875rem", padding: "0.6rem" }}
                      >
                        {switchingCircleId === room.id && switchCircleMutation.isPending ? "Switching…" : "Switch to Circle"}
                      </button>
                    )}
                    {isCurrentRoom && (
                      <Link href="/circle" style={{ display: "block", textDecoration: "none", width: "100%", textAlign: "center", padding: "0.6rem", fontSize: "0.875rem", background: "var(--gold)", color: "var(--dark)", fontWeight: 600, borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer" }}>
                        Go to Circle
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <section style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }} className="sm:!grid-cols-4">
          {[
            { label: "Bookmarks", value: bookmarksFailed ? "—" : bookmarksCount, href: "/circle/archive#bookmarks" as const },
            { label: "Collections", value: collectionsFailed ? "—" : collectionsCount, href: "/circle/archive#collections" as const },
            { label: "Notes", value: notesFailed ? "—" : notesCount, href: "/circle/archive#notes" as const },
            { label: "This Month", value: monthlyReflections, href: undefined as undefined },
          ].map(({ label, value, href }) =>
            href ? (
              <a key={label} href={href} className="glass-card" style={{ display: "block", padding: "1.25rem", textDecoration: "none", cursor: "pointer" }}>
                <span className="muted-kicker" style={{ display: "flex", marginBottom: "0.65rem" }}>{label}</span>
                <p style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1 }}>
                  {loading ? <span className="skeleton" style={{ display: "inline-block", width: "2rem", height: "1.75rem", borderRadius: "var(--radius-sm)" }} /> : value}
                </p>
              </a>
            ) : (
              <div key={label} className="glass-card" style={{ display: "block", padding: "1.25rem", cursor: "default" }}>
                <span className="muted-kicker" style={{ display: "flex", marginBottom: "0.65rem" }}>{label}</span>
                <p style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1 }}>
                  {loading ? <span className="skeleton" style={{ display: "inline-block", width: "2rem", height: "1.75rem", borderRadius: "var(--radius-sm)" }} /> : value}
                </p>
              </div>
            ),
          )}
        </section>

      </main>
    </AppShell>
  )
}
