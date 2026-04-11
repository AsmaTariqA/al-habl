"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { session } from "@/lib/session"

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [circleName, setCircleName] = useState("")
  const [description, setDescription] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [createLoading, setCreateLoading] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null)
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null)
  const [grantedScope] = useState<string | null>(() =>
    typeof window === "undefined" ? null : sessionStorage.getItem("qf_last_granted_scope"),
  )
  const scopeLimited = searchParams.get("scope_limited") === "1"

  useEffect(() => {
    const existingRoomId = session.getRoomId()
    if (existingRoomId) {
      router.replace("/circle")
      return
    }

    const restoreRoom = async () => {
      const response = await fetch("/api/circle")
      const data = (await response.json()) as { room?: { id: string } | null }
      if (data.room?.id) {
        session.setRoomId(data.room.id)
        router.replace("/circle")
      }
    }

    void restoreRoom()
  }, [router])

  async function handleCreateCircle() {
    setCreateError(null)

    if (!circleName.trim()) {
      setCreateError("Please give your circle a name.")
      return
    }

    setCreateLoading(true)
    const response = await fetch("/api/circle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: circleName.trim(),
        description: description.trim(),
      }),
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
    setCreatedInviteCode(data.inviteCode ?? "Invite unavailable")
    setCreateLoading(false)
  }

  async function handleJoinCircle() {
    setJoinError(null)
    const normalizedCode = inviteCode.trim().toUpperCase()

    if (!normalizedCode) {
      setJoinError("Please enter the invite code.")
      return
    }

    setJoinLoading(true)
    const response = await fetch("/api/circle/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: normalizedCode }),
    })

    const data = (await response.json()) as {
      error?: string
      room?: { id: string } | null
    }

    if (!response.ok || !data.room?.id) {
      setJoinError(data.error ?? "Circle not found.")
      setJoinLoading(false)
      return
    }

    session.setRoomId(data.room.id)
    router.push("/circle")
  }

  async function copyInviteCode() {
    if (!createdInviteCode) return
    await navigator.clipboard.writeText(createdInviteCode)
  }

  return (
    <div className="min-h-screen bg-[var(--ink)] px-4 py-6 text-[var(--text)] sm:py-10">
      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[1040px] items-center justify-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.16),transparent_36%)]" />
        <div className="pointer-events-none absolute inset-x-6 top-10 h-40 rounded-full bg-[radial-gradient(circle,rgba(201,168,76,0.12),transparent_70%)] blur-3xl" />

        <div className="relative z-10 w-full space-y-8">
          <div className="space-y-4 text-center">
            <p className="muted-kicker">Circle Onboarding</p>
            <h1 className="page-heading mx-auto max-w-[12ch]">
              Start or join your daily study circle
            </h1>
            <p className="section-subcopy mx-auto max-w-[40rem]">
              Every day, the same ayah. The same five lenses. The same few companions
              returning with you.
            </p>
          </div>

          {scopeLimited ? (
            <section className="status-banner space-y-3">
              <p className="muted-kicker">QF Scope Debug</p>
              <p className="text-sm text-[#f0a7a0]">
                Login worked, but Quran Foundation still denied room access for this token.
              </p>
              <div className="rounded-[18px] border border-white/8 bg-white/4 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  Granted scopes
                </p>
                <p className="mt-2 break-words font-mono text-sm text-[var(--gold)]">
                  {grantedScope ?? "No scope string was returned by the token exchange."}
                </p>
              </div>
            </section>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="glass-card space-y-6 p-5 sm:p-6">
              <div className="space-y-2">
                <p className="muted-kicker">Option A</p>
                <h2 className="text-2xl font-semibold sm:text-3xl">Create a Circle</h2>
                <p className="section-subcopy">
                  You&apos;ll get an invite code to share with up to 4 people.
                </p>
              </div>

              <label className="block space-y-2">
                <span className="text-sm text-[var(--muted)]">Circle name</span>
                <input
                  className="input-field"
                  placeholder="Morning Brothers"
                  value={circleName}
                  onChange={(event) => setCircleName(event.target.value)}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-[var(--muted)]">Description</span>
                <textarea
                  className="textarea-field min-h-[110px]"
                  placeholder="Optional: Who is this circle for, and what rhythm do you want to keep?"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>

              {createError ? (
                <p className="rounded-[18px] border border-[#f0a7a0]/20 bg-[#f0a7a0]/10 px-4 py-3 text-sm text-[#f0a7a0]">
                  {createError}
                </p>
              ) : null}

              <button
                type="button"
                className="button-primary w-full"
                onClick={handleCreateCircle}
                disabled={createLoading}
              >
                {createLoading ? "Creating..." : "Create Circle"}
              </button>
            </section>

            <section className="glass-card space-y-6 p-5 sm:p-6">
              <div className="space-y-2">
                <p className="muted-kicker">Option B</p>
                <h2 className="text-2xl font-semibold sm:text-3xl">Join a Circle</h2>
                <p className="section-subcopy">
                  Enter the 6-character invite code you were given.
                </p>
              </div>

              <label className="block space-y-2">
                <span className="text-sm text-[var(--muted)]">Invite code</span>
                <input
                  className="input-field font-mono uppercase tracking-[0.24em]"
                  placeholder="AH-103"
                  maxLength={6}
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                />
              </label>

              {joinError ? (
                <p className="rounded-[18px] border border-[#f0a7a0]/20 bg-[#f0a7a0]/10 px-4 py-3 text-sm text-[#f0a7a0]">
                  {joinError}
                </p>
              ) : null}

              <button
                type="button"
                className="button-secondary w-full border-[var(--gold-border)] text-[var(--text)]"
                onClick={handleJoinCircle}
                disabled={joinLoading}
              >
                {joinLoading ? "Joining..." : "Join Circle"}
              </button>
            </section>
          </div>
        </div>
      </div>

      {createdInviteCode ? (
        <>
          <button
            type="button"
            className="sheet-backdrop"
            aria-label="Close invite modal"
            onClick={() => setCreatedInviteCode(null)}
          />
          <div className="sheet-panel space-y-5">
            <div className="mx-auto h-1.5 w-16 rounded-full bg-white/12" />
            <div className="space-y-2 text-center">
              <p className="muted-kicker">Invite Code</p>
              <h2 className="text-2xl font-semibold">Your circle is ready</h2>
              <p className="text-sm text-[var(--muted)]">
                Share this code with the people you want studying beside you.
              </p>
            </div>

            <div className="glass-card px-4 py-5 text-center">
              <p className="font-mono text-3xl tracking-[0.35em] text-[var(--gold)]">
                {createdInviteCode}
              </p>
            </div>

            <button type="button" className="button-secondary w-full" onClick={copyInviteCode}>
              Copy invite code
            </button>
            <button
              type="button"
              className="button-primary w-full"
              onClick={() => {
                if (createdRoomId) {
                  session.setRoomId(createdRoomId)
                }
                router.push("/circle")
              }}
            >
              Continue to your circle
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
