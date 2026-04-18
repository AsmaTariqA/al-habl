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

  // Check if user already has a room
 useEffect(() => {
  fetch("/api/circle")
    .then(r => r.json())
    .then((data: { room?: { id: string } | null; circles?: CircleRow[] }) => {
      // ✅ Always show available circles (including joined ones)
      setCircles(data.circles ?? [])
    })
    .catch(() => {
      // optional: you can set an error state here later
    })
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

  return (
    <div className="min-h-screen bg-[var(--ink)] px-4 py-8 text-[var(--text)]">
      <div className="mx-auto max-w-[960px] space-y-8">

        <div className="text-center space-y-3 pt-4">
          <p className="text-xs font-semibold tracking-widest uppercase text-[var(--muted)]">
            Circle Onboarding
          </p>
          <h1 className="text-3xl font-semibold">Start or join your daily study circle</h1>
          <p className="text-[var(--muted)] max-w-md mx-auto text-sm">
            Every day, the same ayah. The same five lenses. The same companions returning with you.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">

          {/* Create a circle */}
          <section className="rounded-2xl border border-white/8 bg-white/3 p-6 space-y-4">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-[var(--muted)] mb-1">
                Option A
              </p>
              <h2 className="text-2xl font-semibold">Create a Circle</h2>
              <p className="text-sm text-[var(--muted)] mt-1">
                Start your own circle. Others on Al-Habl can join it.
              </p>
            </div>

            <input
              className="w-full rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 text-sm placeholder:text-[var(--muted)] focus:outline-none focus:border-white/20"
              placeholder="Circle name e.g. Morning Brothers"
              value={circleName}
              onChange={e => setCircleName(e.target.value)}
            />

            <textarea
              className="w-full rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 text-sm placeholder:text-[var(--muted)] focus:outline-none focus:border-white/20 min-h-[80px] resize-none"
              placeholder="Description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />

            {createError && (
              <p className="text-sm text-red-300/80 rounded-xl border border-red-300/20 bg-red-300/10 px-3 py-2">
                {createError}
              </p>
            )}

            <button
              type="button"
              onClick={() => void handleCreateCircle()}
              disabled={createLoading}
              className="w-full rounded-xl bg-[var(--gold)] py-2.5 text-sm font-semibold text-[var(--ink)] hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {createLoading ? "Creating…" : "Create Circle"}
            </button>
          </section>

          {/* Browse and join */}
          <section className="rounded-2xl border border-white/8 bg-white/3 p-6 space-y-4">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-[var(--muted)] mb-1">
                Option B
              </p>
              <h2 className="text-2xl font-semibold">Join a Circle</h2>
              <p className="text-sm text-[var(--muted)] mt-1">
                Browse circles created by Al-Habl users.
              </p>
            </div>

            <input
              className="w-full rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 text-sm placeholder:text-[var(--muted)] focus:outline-none focus:border-white/20"
              placeholder="Search by name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            {joinError && (
              <p className="text-sm text-red-300/80 rounded-xl border border-red-300/20 bg-red-300/10 px-3 py-2">
                {joinError}
              </p>
            )}

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {circlesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-white/4 animate-pulse" />
                ))
              ) : filteredCircles.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-[var(--muted)]">
                    {circles.length === 0
                      ? "No circles yet. Be the first to create one."
                      : "No circles match your search."}
                  </p>
                </div>
              ) : (
                filteredCircles.map(circle => (
                  <div
                    key={circle.id}
                    className="flex items-center justify-between rounded-xl border border-white/8 bg-white/3 px-4 py-3"
                  >
                    <div className="min-w-0 mr-3">
                      <p className="text-sm font-medium truncate">{circle.name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {circle.member_count} {circle.member_count === 1 ? "member" : "members"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleJoinCircle(circle.id)}
                      disabled={joiningId === circle.id}
                      className="flex-shrink-0 rounded-xl border border-[var(--gold-border)] bg-[var(--gold-dim)] px-3 py-1.5 text-xs text-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--ink)] transition-all disabled:opacity-40"
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

      {/* Created circle sheet */}
      {createdInviteCode && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setCreatedInviteCode(null)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg rounded-t-[28px] border-t border-white/8 bg-[#161411] p-6 pb-10 space-y-5">
            <div className="mx-auto h-1 w-12 rounded-full bg-white/15" />
            <div className="text-center space-y-1">
              <h2 className="text-xl font-semibold">Your circle is ready</h2>
              <p className="text-sm text-[var(--muted)]">
                Others can find and join your circle from the onboarding screen.
              </p>
            </div>
            {createdInviteCode && (
              <div className="rounded-xl border border-[var(--gold-border)] bg-[var(--gold-dim)] px-4 py-4 text-center">
                <p className="text-xs text-[var(--muted)] mb-1">Invite link (optional)</p>
                <p className="font-mono text-xs text-[var(--gold)] break-all">{createdInviteCode}</p>
              </div>
            )}
            <button
              type="button"
              className="w-full rounded-xl bg-[var(--gold)] py-2.5 text-sm font-semibold text-[var(--ink)]"
              onClick={() => {
                if (createdRoomId) session.setRoomId(createdRoomId)
                router.push("/circle")
              }}
            >
              Continue to your circle
            </button>
          </div>
        </>
      )}
    </div>
  )
}