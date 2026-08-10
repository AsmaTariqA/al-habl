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
import { ActivityCalendar } from "@/features/circle/ActivityCalender"
import {
  qfProfileExtrasQueryFn,
  type ProfileExtrasResult,
} from "@/lib/qf/queryFns"
import { createGoal } from "@/lib/qf-api"
import { session } from "@/lib/session"

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")
}

/* ────────────────────────────────────────────────────────────────
   Sheet — bottom-sheet modal, reused for Create Circle and Join
   Circle. Matches the pattern already used elsewhere in the app
   (see the Circle page's Sheet component) so this feels consistent
   rather than introducing a new modal pattern.
   ──────────────────────────────────────────────────────────────── */
function Sheet({ open, title, kicker, onClose, children }: { open: boolean; title: string; kicker?: string; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null
  return (
    <>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", cursor: "pointer", border: "none" }}
      />
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          margin: "0 auto",
          maxWidth: "32rem",
          maxHeight: "85vh",
          overflowY: "auto",
          borderRadius: "28px 28px 0 0",
          borderTop: "1px solid var(--glass-border)",
          background: "var(--ink-raised)",
          padding: "1.5rem 1.5rem 2.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          boxShadow: "0 -12px 40px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ width: "40px", height: "4px", borderRadius: "99px", background: "var(--glass-border)", margin: "0 auto" }} />
        {kicker && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>
            {kicker}
          </span>
        )}
        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.03em", marginTop: kicker ? "-0.75rem" : 0 }}>{title}</h3>
        {children}
      </div>
    </>
  )
}

export function ProfileView() {
  const queryClient = useQueryClient()
  const [goalType, setGoalType] = useState("Read 1 verse daily")
  const [goalTarget, setGoalTarget] = useState(7)
  const [switchingCircleId, setSwitchingCircleId] = useState<string | null>(null)

  // ── Create / Join Circle modal state ──
  const [createCircleOpen, setCreateCircleOpen] = useState(false)
  const [joinCircleOpen, setJoinCircleOpen] = useState(false)
  const [newCircleName, setNewCircleName] = useState("")
  const [newCircleType, setNewCircleType] = useState<"public" | "private">("private")
  const [newCircleDescription, setNewCircleDescription] = useState("")
  const [inviteCodeInput, setInviteCodeInput] = useState("")

  const profileQ = useQfProfileQuery()
  const streakQ = useQfStreaksQuery()

  const extrasQ = useQuery({
    queryKey: qfKeys.profileExtras(),
    queryFn: qfProfileExtrasQueryFn,
    staleTime: 90_000,
  })

  const profile = profileQ.data ?? null
  const streak = streakQ.data ?? null

  const goals = extrasQ.data?.goals ?? []
  const rooms = extrasQ.data?.rooms ?? []
  const currentRoomId = session.getRoomId()
  const bookmarksCount = extrasQ.data?.bookmarks?.length ?? 0
  const collectionsCount = extrasQ.data?.collections?.length ?? 0
  const notesCount = extrasQ.data?.notes?.length ?? 0
  const monthlyReflections = extrasQ.data?.monthlyReflections ?? 0

  const loading = profileQ.isPending || streakQ.isPending || extrasQ.isPending
  const streakFailed = streakQ.isError
  const bookmarksFailed = extrasQ.isError
  const collectionsFailed = extrasQ.isError
  const notesFailed = extrasQ.isError
  const error = profileQ.isError ? "We couldn't load part of your profile." : null

  const createGoalMutation = useMutation({
    mutationFn: async () => {
      const token = await getClientAccessToken()
      if (!token) return null
      return createGoal(token, goalType, goalTarget)
    },
    onSuccess: (goal) => {
      if (!goal) return
      queryClient.setQueryData<ProfileExtrasResult | null>(qfKeys.profileExtras(), (old) => {
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
      })
    },
  })

  const switchCircleMutation = useMutation({
    mutationFn: async (roomId: string) => {
      session.setRoomId(roomId)
      window.location.href = "/circle"
    },
  })

  /*
    TODO: wire these to your actual create-circle / join-circle API
    calls (whatever createCircle() / joinCircleByCode() functions
    exist in lib/qf-api, similar to createGoal above). Left as a
    clear integration point rather than guessing at endpoint shapes
    that weren't in the code I was given.
  */
  const createCircleMutation = useMutation({
    mutationFn: async () => {
      const token = await getClientAccessToken()
      if (!token) return null
      // return await createCircle(token, { name: newCircleName, type: newCircleType, description: newCircleDescription })
      throw new Error("createCircle API call not yet wired — see TODO above")
    },
    onSuccess: () => {
      setCreateCircleOpen(false)
      setNewCircleName("")
      setNewCircleDescription("")
      void queryClient.invalidateQueries({ queryKey: qfKeys.profileExtras() })
    },
  })

  const joinCircleMutation = useMutation({
    mutationFn: async () => {
      const token = await getClientAccessToken()
      if (!token) return null
      // return await joinCircleByCode(token, inviteCodeInput.trim())
      throw new Error("joinCircleByCode API call not yet wired — see TODO above")
    },
    onSuccess: () => {
      setJoinCircleOpen(false)
      setInviteCodeInput("")
      void queryClient.invalidateQueries({ queryKey: qfKeys.profileExtras() })
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
          width: "100%",
          padding: "2rem 1rem 6rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        {/* ── Identity + streaks ── */}
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

        {/* ── Activity calendar — single source now, old duplicate heatmap removed ── */}
        <ActivityCalendar
          activityDays={extrasQ.data?.activityDays ?? []}
          loading={extrasQ.isPending}
          monthsToShow={6}
        />

        {/* ── My Circles — now the single home for viewing, switching,
             creating, and joining circles. Current circle is shown
             inline at the top of the list (highlighted), rather than
             duplicated in a separate section above. ── */}
        <section className="glass-card" style={{ padding: "1.5rem 2rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            <div>
              <span className="muted-kicker" style={{ display: "flex", marginBottom: "0.35rem" }}>My Circles</span>
              <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>Your study spaces, and a place to discover new ones.</p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
              <button type="button" className="button-secondary" onClick={() => setJoinCircleOpen(true)} style={{ fontSize: "0.825rem", padding: "0.5rem 1rem" }}>
                Join a Circle
              </button>
              <button type="button" className="button-primary" onClick={() => setCreateCircleOpen(true)} style={{ fontSize: "0.825rem", padding: "0.5rem 1rem" }}>
                + Create a Circle
              </button>
            </div>
          </div>

          {rooms.length === 0 && !loading ? (
            <div style={{ padding: "2.5rem 2rem", textAlign: "center", background: "var(--gold-dim)", border: "1px solid var(--gold-border)", borderRadius: "var(--radius-lg)" }}>
              <p style={{ fontWeight: 600, color: "var(--gold)", marginBottom: "0.35rem" }}>You haven&apos;t joined a circle yet</p>
              <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>Create your own, or join one to get started.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
              {rooms.map((room) => {
                const isCurrentRoom = room.id === currentRoomId
                return (
                  <div
                    key={room.id}
                    style={{
                      padding: "1.25rem",
                      background: isCurrentRoom ? "var(--gold-dim)" : "var(--glass)",
                      border: `1px solid ${isCurrentRoom ? "var(--gold-border)" : "var(--glass-border)"}`,
                      borderRadius: "var(--radius-md)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <h4 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{room.name}</h4>
                        {isCurrentRoom && (
                          <span style={{ fontSize: "0.65rem", padding: "0.25rem 0.5rem", background: "var(--gold)", color: "var(--dark)", fontWeight: 600, borderRadius: "var(--radius-sm)", flexShrink: 0 }}>
                            Active
                          </span>
                        )}
                      </div>
                      {room.description && (
                        <p style={{ fontSize: "0.8rem", color: "var(--muted)", lineHeight: 1.4, marginBottom: "0.75rem" }}>{room.description}</p>
                      )}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
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
                    {isCurrentRoom ? (
                      <Link
                        href="/circle"
                        style={{ display: "block", textDecoration: "none", width: "100%", textAlign: "center", padding: "0.6rem", fontSize: "0.875rem", background: "var(--gold)", color: "var(--dark)", fontWeight: 600, borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer" }}
                      >
                        Go to Circle
                      </Link>
                    ) : (
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
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Goals ── */}
        <section className="glass-card" style={{ padding: "1.5rem 2rem" }}>
          <span className="muted-kicker" style={{ display: "flex", marginBottom: "0.35rem" }}>Goals</span>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "1.25rem" }}>Track your rhythm — a gentle record, not a scoreboard.</p>
          {goals.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
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

        {/* ── Archive — grouped under one clear section header now,
             rather than floating unlabeled at the page bottom ── */}
        <section>
          <div style={{ marginBottom: "0.875rem" }}>
            <span className="muted-kicker" style={{ display: "flex", marginBottom: "0.35rem" }}>Archive</span>
            <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>Everything you&apos;ve saved and reflected on.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.75rem" }}>
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
          </div>
        </section>

        {error && (
          <p style={{ fontSize: "0.75rem", color: "#f87171", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-sm)" }}>
            {error}
          </p>
        )}
      </main>

      {/* ── Create Circle Sheet ── */}
      <Sheet open={createCircleOpen} title="Create a study circle" kicker="New circle" onClose={() => setCreateCircleOpen(false)}>
        <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "-0.5rem" }}>Create a focused space for your daily return.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text)" }}>Circle name</label>
          <input
            style={inputStyle}
            placeholder="e.g. Morning Brothers"
            value={newCircleName}
            onChange={(e) => setNewCircleName(e.target.value)}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--gold-border)" }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--glass-border)" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text)" }}>Circle type</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["public", "private"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setNewCircleType(type)}
                style={{
                  flex: 1,
                  padding: "0.6rem",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textTransform: "capitalize",
                  cursor: "pointer",
                  border: `1px solid ${newCircleType === type ? "var(--gold-border)" : "var(--glass-border)"}`,
                  background: newCircleType === type ? "var(--gold)" : "var(--glass-strong)",
                  color: newCircleType === type ? "var(--dark)" : "var(--muted)",
                }}
              >
                {type}
              </button>
            ))}
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
            Public circles can be discovered in search. Private circles require an invite.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text)" }}>Description · optional</label>
          <textarea
            style={{ ...inputStyle, minHeight: "80px", resize: "none" }}
            placeholder="What will your circle study?"
            value={newCircleDescription}
            onChange={(e) => setNewCircleDescription(e.target.value)}
            onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--gold-border)" }}
            onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--glass-border)" }}
          />
        </div>

        <button
          type="button"
          className="button-primary"
          onClick={() => void createCircleMutation.mutate()}
          disabled={createCircleMutation.isPending || !newCircleName.trim()}
          style={{ width: "100%" }}
        >
          {createCircleMutation.isPending ? "Creating…" : "Create Circle"}
        </button>
        <p style={{ fontSize: "0.72rem", color: "var(--muted)", textAlign: "center" }}>You can change visibility later in circle settings.</p>
      </Sheet>

      {/* ── Join Circle Sheet ── */}
      <Sheet open={joinCircleOpen} title="Join a study circle" kicker="Find a circle" onClose={() => setJoinCircleOpen(false)}>
        <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "-0.5rem" }}>Find a public circle, or join one privately with an invite code.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text)" }}>Invite code</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              placeholder="Paste invite code…"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value)}
              onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--gold-border)" }}
              onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--glass-border)" }}
            />
            <button
              type="button"
              className="button-primary"
              onClick={() => void joinCircleMutation.mutate()}
              disabled={joinCircleMutation.isPending || !inviteCodeInput.trim()}
            >
              {joinCircleMutation.isPending ? "Joining…" : "Join"}
            </button>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Private circles are only accessible with an invitation.</p>
        </div>

        {/*
          TODO: public-circle search/browse list goes here once a
          searchCircles() or listPublicCircles() API call exists —
          matching the "Find a circle" search UI from the Figma
          design (search bar + list of public circle cards, each
          with its own Join button). Left as a clear next step since
          that endpoint wasn't in the code provided.
        */}
      </Sheet>
    </AppShell>
  )
}