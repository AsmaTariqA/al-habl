"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAyah } from "@/hooks/useAyah"
import { useCircle } from "@/hooks/useCircle"
import { getClientAccessToken } from "@/lib/client-access"
import { addToCollection, bookmarkVerse, createCollection, createNote, getCollections, getStreaks } from "@/lib/qf-api"
import { LENSES, LENS_LABELS, LENS_PROMPTS, getTodayLens, type Lens } from "@/lib/circle-constants"
import { session } from "@/lib/session"
import { AyahSelector } from "@/components/circle/AyahSelector"
import type { RoomMember, VerseCollection } from "@/types/circle"

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

function timeAgo(isoDate: string) {
  const diff = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.max(Math.floor(diff / 60_000), 0)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")
}

function Avatar({ name, active, size = "md" }: { name: string; active?: boolean; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-14 w-14 text-sm" : "h-10 w-10 text-xs"
  return (
    <div className={`${sz} flex items-center justify-center rounded-full border font-medium transition-all ${active ? "border-[var(--gold-border)] bg-[var(--gold-dim)] text-[var(--gold)] shadow-[0_0_12px_rgba(201,168,76,0.2)]" : "border-white/10 bg-white/5 text-[var(--muted)]"}`}>
      {getInitials(name)}
    </div>
  )
}

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-white/6 bg-white/3 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="skeleton h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="skeleton h-3 w-28 rounded-full" />
              <div className="skeleton h-2.5 w-16 rounded-full" />
            </div>
            <div className="skeleton h-5 w-20 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="skeleton h-3 w-full rounded-full" />
            <div className="skeleton h-3 w-[88%] rounded-full" />
            <div className="skeleton h-3 w-[72%] rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function Sheet({ open, title, kicker, onClose, children }: { open: boolean; title: string; kicker?: string; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null
  return (
    <>
      <button type="button" className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg rounded-t-[28px] border-t border-white/8 bg-[#161411] p-6 pb-10 shadow-2xl space-y-5 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:rounded-2xl md:border md:border-white/10">
        <div className="mx-auto h-1 w-12 rounded-full bg-white/15 md:hidden" />
        {kicker && <p className="text-xs font-semibold tracking-widest uppercase text-[var(--muted)]">{kicker}</p>}
        <h3 className="text-xl font-semibold">{title}</h3>
        {children}
      </div>
    </>
  )
}

export default function CirclePage() {
  const router = useRouter()
  const [roomId, setRoomId] = useState<string | null>(() => session.getRoomId())
  const [selectedLens, setSelectedLens] = useState<Lens>(() => getTodayLens())
  const [composerBody, setComposerBody] = useState("")
  const [commentsOpen, setCommentsOpen] = useState<Record<string, boolean>>({})
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [streakCount, setStreakCount] = useState<number | null>(null)
  const [ayahExpanded, setAyahExpanded] = useState(false)
  const [selectedTranslationId, setSelectedTranslationId] = useState<number | null>(131)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [collectionSheetOpen, setCollectionSheetOpen] = useState(false)
  const [noteSheetOpen, setNoteSheetOpen] = useState(false)
  const [collections, setCollections] = useState<VerseCollection[]>([])
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [newCollectionName, setNewCollectionName] = useState("")
  const [noteBody, setNoteBody] = useState("")
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [collectionLoading, setCollectionLoading] = useState(false)
  const [noteLoading, setNoteLoading] = useState(false)
  const [audioReady, setAudioReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [aiQuestions, setAiQuestions] = useState<string[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [selectedOverrideVerseKey, setSelectedOverrideVerseKey] = useState<string | undefined>(undefined)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const {
    verse, chapter, audio, tafsir,
    loading: ayahLoading, tafsirLoading, error: ayahError,
    lens, verseKey, dayNumber, fetchVerse, fetchTafsirForToday
  } = useAyah(selectedOverrideVerseKey)

  const {
    room, members, posts, commentsByPost, loadingComments,
    loading, submitting, error,
    postReflection, likePost, loadComments, addComment
  } = useCircle(roomId)

  const activeTranslation = !verse?.translations.length
    ? null
    : !selectedTranslationId
      ? verse.translations[0]
      : verse.translations.find((t) => t.id === selectedTranslationId) ?? verse.translations[0]


const uniqueMembersMap = new Map()
members.forEach((m) => {
  if (!uniqueMembersMap.has(m.user_id)) {
    uniqueMembersMap.set(m.user_id, m)
  }
})

const uniqueMembers = Array.from(uniqueMembersMap.values())

const reflectedCount = uniqueMembers.filter((m) => m.has_reflected_today).length
  const selectedLensPrompts = LENS_PROMPTS[selectedLens]
  const featuredPrompt = selectedLensPrompts[(dayNumber - 1) % selectedLensPrompts.length]

  // Redirect to onboarding if no room
  useEffect(() => {
    if (roomId) return
    const existing = session.getRoomId()
    if (existing) return
    fetch("/api/circle")
      .then((r) => r.json())
      .then((data: { room?: { id: string } | null }) => {
        if (!data.room?.id) { router.replace("/onboarding"); return }
        session.setRoomId(data.room.id)
        setRoomId(data.room.id)
      })
      .catch(() => router.replace("/onboarding"))
  }, [roomId, router])

  // Load streak — fail silently if 403 (pre-prod scope issue)
  useEffect(() => {
    getClientAccessToken()
      .then(async (token) => {
        if (!token) return
        const streak = await getStreaks(token).catch(() => null)
        if (streak?.current_streak != null) setStreakCount(streak.current_streak)
      })
      .catch(() => null)
  }, [])

  // Audio setup
  useEffect(() => {
    if (!audio?.url) return
    const el = new Audio(audio.url)
    audioRef.current = el
    const onLoaded = () => { setDuration(el.duration); setAudioReady(true) }
    const onTimeUpdate = () => setCurrentTime(el.currentTime)
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0) }
    el.addEventListener("loadedmetadata", onLoaded)
    el.addEventListener("timeupdate", onTimeUpdate)
    el.addEventListener("ended", onEnded)
    return () => {
      el.pause()
      el.removeEventListener("loadedmetadata", onLoaded)
      el.removeEventListener("timeupdate", onTimeUpdate)
      el.removeEventListener("ended", onEnded)
    }
  }, [audio?.url])

  // Load collections when sheet opens — fail silently
  useEffect(() => {
    if (!collectionSheetOpen) return
    getClientAccessToken()
      .then(async (token) => {
        if (!token) return
        const items = await getCollections(token).catch(() => null)
        setCollections(items ?? [])
      })
      .catch(() => null)
  }, [collectionSheetOpen])

  async function toggleAudio() {
    if (!audioRef.current) return
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); return }
    await audioRef.current.play()
    setIsPlaying(true)
  }

  async function handleBookmark() {
    setBookmarkLoading(true)
    try {
      const token = await getClientAccessToken()
      if (!token) { setActionMessage("Not logged in."); return }
      const saved = await bookmarkVerse(token, verseKey).catch(() => null)
      setActionMessage(saved ? "Ayah bookmarked ✓" : "Bookmarking unavailable right now")
    } catch {
      setActionMessage("Bookmarking unavailable right now")
    } finally {
      setBookmarkLoading(false)
      setTimeout(() => setActionMessage(null), 2500)
    }
  }

  async function handleCollectionSave() {
    setCollectionLoading(true)
    try {
      const token = await getClientAccessToken()
      if (!token) { setActionMessage("Not logged in."); return }
      let id = selectedCollectionId
      if (!id && newCollectionName.trim()) {
        const created = await createCollection(token, newCollectionName.trim()).catch(() => null)
        id = created?.id ?? null
      }
      if (!id) { setActionMessage("Choose or create a collection first."); return }
      const added = await addToCollection(token, id, verseKey).catch(() => null)
      setCollectionSheetOpen(false)
      setSelectedCollectionId(null)
      setNewCollectionName("")
      setActionMessage(added ? "Added to collection ✓" : "Collections unavailable right now")
    } catch {
      setActionMessage("Collections unavailable right now")
    } finally {
      setCollectionLoading(false)
      setTimeout(() => setActionMessage(null), 2500)
    }
  }

  async function handleSaveNote() {
    setNoteLoading(true)
    try {
      const token = await getClientAccessToken()
      if (!token) { setActionMessage("Not logged in."); return }
      const saved = await createNote(token, verseKey, noteBody.trim()).catch(() => null)
      if (saved) {
        setNoteBody("")
        setNoteSheetOpen(false)
        setActionMessage("Note saved ✓")
      } else {
        setActionMessage("Notes unavailable right now")
      }
    } catch {
      setActionMessage("Notes unavailable right now")
    } finally {
      setNoteLoading(false)
      setTimeout(() => setActionMessage(null), 2500)
    }
  }

  async function handleExpandAyah() {
    const next = !ayahExpanded
    setAyahExpanded(next)
    if (next && !tafsir) await fetchTafsirForToday()
  }

  async function handleSubmitReflection() {
    const body = composerBody.trim()
    if (body.length < 15) { setActionMessage("Reflection must be at least 15 characters."); return }
    const created = await postReflection(body, selectedLens)
    if (created) {
      setComposerBody("")
      setSelectedLens(lens)
      setAiQuestions([])
    }
  }

  async function handleAiDeepen() {
    if (aiLoading || !verse || !composerBody.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch("/api/ai/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verseKey,
          verseText: verse.text_uthmani,
          lens: selectedLens,
          reflection: composerBody,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.questions) {
          const qs = data.questions.split(/\n/).filter((l: string) => l.trim()).slice(0, 2)
          setAiQuestions(qs)
        }
      }
    } finally {
      setAiLoading(false)
    }
  }

  async function toggleComments(postId: string) {
    const next = !commentsOpen[postId]
    setCommentsOpen((c) => ({ ...c, [postId]: next }))
    if (next) await loadComments(postId)
  }

  async function submitComment(postId: string) {
    const body = commentDrafts[postId]?.trim()
    if (!body) return
    const created = await addComment(postId, body)
    if (created) setCommentDrafts((c) => ({ ...c, [postId]: "" }))
  }

  return (
    <div className="min-h-screen bg-[var(--ink)] text-[var(--text)]">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-80 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(201,168,76,0.12),transparent)]" />

      {/* Main layout */}
      <div className="xl:mr-80">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 px-4 pt-3 pb-2 bg-[rgba(15,14,12,0.85)] backdrop-blur-xl border-b border-white/6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold tracking-widest text-[var(--gold)] uppercase">Al-Habl</p>
              <p className="text-sm font-medium">{room?.name ?? "Your Circle"}</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setRightPanelOpen(!rightPanelOpen)}
                className="rounded-xl border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-[var(--muted)]">
                Members
              </button>
              {streakCount !== null && (
                <div className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-dim)] px-2.5 py-1 text-xs text-[var(--gold)]">
                  {streakCount}d
                </div>
              )}
              <button
                type="button"
                onClick={async () => {
                  const confirmed = window.confirm("Are you sure you want to log out?")
                  if (!confirmed) return
                  await fetch("/api/auth/logout", { method: "POST" })
                  localStorage.clear()
                  window.location.href = "/auth/login"
                }}
                className="rounded-xl border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-[var(--muted)] hover:text-red-400"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" />
                  <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Desktop title bar */}
        <div className="hidden lg:flex items-center justify-between px-8 pt-6 pb-4">
          <div>
            <h1 className="text-2xl font-semibold">Today&apos;s Circle</h1>
            <p className="text-sm text-[var(--muted)] mt-0.5">Day {dayNumber} · {verseKey}</p>
          </div>
          <button type="button" onClick={() => setInviteOpen(true)}
            className="rounded-xl border border-white/10 bg-white/4 px-4 py-2 text-sm hover:border-[var(--gold-border)] hover:bg-[var(--gold-dim)] hover:text-[var(--gold)] transition-all">
            + Invite Members
          </button>
          <AyahSelector currentVerseKey={verseKey} onSelect={(verseKey) => {
            const cacheKey = `qf_daily_ayah:${verseKey}`
            if (typeof window !== "undefined") {
              localStorage.removeItem(cacheKey)
            }
            setSelectedOverrideVerseKey(verseKey)
            setTimeout(() => void fetchVerse(), 0)
          }} />
        </div>

        <main className="px-4 lg:px-8 pb-24 lg:pb-8 space-y-5">

          {/* Ayah card */}
          <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
            <div className="h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-30" />
            <div className="p-5 lg:p-7">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-mono tracking-widest text-[var(--muted)] uppercase">
                  {chapter?.name_simple ?? "..."} · {verseKey} · Day {dayNumber}
                </p>
                <div className="flex items-center gap-1.5">
                  <button type="button" aria-label="Bookmark" onClick={handleBookmark} disabled={bookmarkLoading}
                    className="h-8 w-8 flex items-center justify-center rounded-xl border border-white/8 bg-white/4 text-[var(--muted)] hover:text-[var(--gold)] hover:border-[var(--gold-border)] transition-all disabled:opacity-40">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 4h10v16l-5-4-5 4V4Z"/></svg>
                  </button>
                  <button type="button" aria-label="Collection" onClick={() => setCollectionSheetOpen(true)}
                    className="h-8 w-8 flex items-center justify-center rounded-xl border border-white/8 bg-white/4 text-[var(--muted)] hover:text-[var(--gold)] hover:border-[var(--gold-border)] transition-all">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="5" width="6" height="6" rx="1.5"/><rect x="14" y="5" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/></svg>
                  </button>
                  <button type="button" aria-label="Note" onClick={() => setNoteSheetOpen(true)}
                    className="h-8 w-8 flex items-center justify-center rounded-xl border border-white/8 bg-white/4 text-[var(--muted)] hover:text-[var(--gold)] hover:border-[var(--gold-border)] transition-all">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 4h10a2 2 0 0 1 2 2v12l-4-3H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg>
                  </button>
                </div>
              </div>

              {ayahLoading
                ? <div className="skeleton h-20 rounded-xl mb-4" />
                : <p className="font-arabic text-right text-[clamp(1.6rem,4vw,2.2rem)] leading-[2.1] mb-4 text-[var(--text)]" dir="rtl" translate="no">{verse?.text_uthmani}</p>
              }

              <div className="h-px bg-white/8 mb-4" />

              {ayahLoading
                ? <div className="space-y-2 mb-5"><div className="skeleton h-3 rounded-full w-full"/><div className="skeleton h-3 rounded-full w-5/6"/><div className="skeleton h-3 rounded-full w-4/6"/></div>
                : <p className="text-sm leading-7 text-[var(--muted)] mb-5 font-light">{activeTranslation?.text}</p>
              }

              {/* Audio player */}
              <div className="flex items-center gap-3 mb-4">
                <button type="button" onClick={toggleAudio} disabled={!audioReady}
                  className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[var(--gold)] text-[var(--ink)] hover:scale-105 transition-transform disabled:opacity-40">
                  {isPlaying
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 6h3v12H8zM13 6h3v12h-3z"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="m8 6 10 6-10 6V6Z"/></svg>
                  }
                </button>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-[var(--gold)] rounded-full transition-all" style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%" }} />
                  </div>
                  <p className="text-xs text-[var(--muted)] tabular-nums whitespace-nowrap">{formatTime(currentTime)} / {formatTime(duration)}</p>
                </div>
              </div>

              {actionMessage && <p className="text-xs text-[var(--gold)] mb-3">{actionMessage}</p>}
              {ayahError && (
                <div className="text-center py-4">
                  <p className="text-xs text-red-300/80 mb-2">{ayahError}</p>
                  <button onClick={() => void fetchVerse()}
                    className="text-xs text-[var(--gold)] underline">
                    Try again
                  </button>
                </div>
              )}

              <button type="button" onClick={() => void handleExpandAyah()}
                className="flex w-full items-center justify-between rounded-xl border border-white/8 bg-white/2 px-4 py-2.5 text-sm text-[var(--muted)] hover:text-[var(--text)] hover:border-white/15 transition-all">
                <span>View tafsir & word-by-word</span>
                <span className="text-[var(--gold)]">{ayahExpanded ? "↑" : "↓"}</span>
              </button>

              {ayahExpanded && (
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-white/8 bg-white/2 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold tracking-widest uppercase text-[var(--muted)]">Ibn Kathir</p>
                      {tafsirLoading && <span className="text-xs text-[var(--muted)]">Loading…</span>}
                    </div>
                    {tafsirLoading
                      ? <div className="space-y-2"><div className="skeleton h-3 rounded-full"/><div className="skeleton h-3 rounded-full"/><div className="skeleton h-3 w-3/4 rounded-full"/></div>
                      : <p className="text-sm leading-7 text-[var(--muted)]">{tafsir?.text ?? "Tafsir not available for this verse."}</p>
                    }
                  </div>

                  {!ayahLoading && verse?.words && (
                    <div className="rounded-xl border border-white/8 bg-white/2 p-4">
                      <p className="text-xs font-semibold tracking-widest uppercase text-[var(--muted)] mb-3">Word by word</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {verse.words.map((word) => (
                          <div key={word.position} className="rounded-xl border border-white/8 bg-white/3 p-2.5">
                            <p className="font-arabic text-right text-lg" dir="rtl" translate="no">{word.text_uthmani}</p>
                            <p className="mt-1 text-xs text-[var(--muted)] text-center">{word.translation.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {verse?.translations && verse.translations.length > 1 && (
                    <div className="rounded-xl border border-white/8 bg-white/2 p-4">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {verse.translations.map((t) => (
                          <button key={t.id} type="button" onClick={() => setSelectedTranslationId(t.id)}
                            className={`rounded-xl border px-3 py-1.5 text-xs transition-all ${selectedTranslationId === t.id ? "border-[var(--gold-border)] bg-[var(--gold-dim)] text-[var(--gold)]" : "border-white/8 text-[var(--muted)] hover:border-white/15"}`}>
                            {t.resource_name}
                          </button>
                        ))}
                      </div>
                      <p className="text-sm leading-7 text-[var(--muted)]">{activeTranslation?.text}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 5 Lenses */}
          <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
            <p className="text-xs font-semibold tracking-widest uppercase text-[var(--muted)] mb-3">Today&apos;s Lens</p>
            <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none">
              {LENSES.map((item) => (
                <button key={item} type="button" onClick={() => setSelectedLens(item)}
                  className={`flex-shrink-0 rounded-xl border px-3 py-1.5 text-sm transition-all ${selectedLens === item ? "border-[var(--gold-border)] bg-[var(--gold-dim)] text-[var(--gold)]" : "border-white/8 text-[var(--muted)] hover:border-white/15 hover:text-[var(--text)]"}`}>
                  {LENS_LABELS[item]}
                </button>
              ))}
            </div>
            <div className="rounded-xl border border-[var(--gold-border)] bg-gradient-to-br from-[var(--gold-dim)] to-transparent p-4">
              <span className="inline-flex items-center rounded-full border border-[var(--gold-border)] bg-[var(--gold-dim)] px-2.5 py-0.5 text-xs text-[var(--gold)] mb-3">
                {LENS_LABELS[selectedLens]}
              </span>
              <p className="text-sm leading-7 font-medium">{featuredPrompt}</p>
              <div className="mt-3 space-y-1.5">
                {selectedLensPrompts.map((p) => (
                  <p key={p} className="text-xs leading-relaxed text-[var(--muted)]">↳ {p}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Reflection feed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-widest uppercase text-[var(--muted)]">Reflections</p>
              {error && <p className="text-xs text-red-300/70">{error}</p>}
            </div>

            {loading ? <FeedSkeleton /> : posts.length === 0 ? (
              <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-dim)] p-8 text-center">
                <p className="text-base font-medium text-[var(--gold)]">Be the first to reflect today</p>
                <p className="mt-1 text-sm text-[var(--muted)]">Your circle is waiting for your reflection.</p>
              </div>
            ) : (
              posts.map((post) => (
                <article key={post.id} className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-3 hover:border-white/12 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={post.username} size="sm" />
                      <div>
                        <p className="text-sm font-medium">{post.username}</p>
                        <p className="text-xs text-[var(--muted)]">{timeAgo(post.created_at)}</p>
                      </div>
                    </div>
                    <span className="flex-shrink-0 rounded-full border border-[var(--gold-border)] bg-[var(--gold-dim)] px-2.5 py-0.5 text-xs text-[var(--gold)]">
                      {LENS_LABELS[(post.lens as Lens) ?? "relevance"]}
                    </span>
                  </div>
                  <p className="text-sm leading-7 text-[var(--text)] font-light">{post.body}</p>
                  <div className="flex items-center gap-4 pt-1">
                    <button type="button" onClick={() => void likePost(post.id)}
                      className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--gold)] transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={post.liked_by_me ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5"><path d="M12 20s-7-4.3-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 10c0 5.7-7 10-7 10Z"/></svg>
                      <span>{post.like_count}</span>
                    </button>
                    <button type="button" onClick={() => void toggleComments(post.id)}
                      className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 6h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 3V8a2 2 0 0 1 2-2Z"/></svg>
                      <span>{post.comment_count}</span>
                    </button>
                  </div>
                  {commentsOpen[post.id] && (
                    <div className="rounded-xl border border-white/8 bg-white/2 p-3 space-y-3 mt-1">
                      {loadingComments[post.id] ? (
                        <div className="space-y-2"><div className="skeleton h-3 rounded-full"/><div className="skeleton h-3 w-4/5 rounded-full"/></div>
                      ) : (
                        <div className="space-y-3">
                          {(commentsByPost[post.id] ?? []).map((c) => (
                            <div key={c.id}>
                              <p className="text-xs text-[var(--muted)]"><span className="text-[var(--text)]">{c.username}</span> · {timeAgo(c.created_at)}</p>
                              <p className="text-sm mt-0.5">{c.body}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <input
                          className="flex-1 rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-sm placeholder:text-[var(--muted)] focus:border-white/20 focus:outline-none"
                          placeholder="Write a comment…"
                          value={commentDrafts[post.id] ?? ""}
                          onChange={(e) => setCommentDrafts((c) => ({ ...c, [post.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submitComment(post.id) } }}
                        />
                        <button type="button" onClick={() => void submitComment(post.id)}
                          className="rounded-xl border border-[var(--gold-border)] bg-[var(--gold-dim)] px-3 py-2 text-xs text-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--ink)] transition-all">
                          →
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>

          {/* Reflection composer */}
          <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold tracking-widest uppercase text-[var(--muted)]">Your Reflection</p>
              <span className={`text-xs ${composerBody.length > 480 ? "text-red-300" : "text-[var(--muted)]"}`}>{composerBody.length}/500</span>
            </div>
            <textarea
              className="w-full rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-sm leading-7 placeholder:text-[var(--muted)] focus:border-white/20 focus:outline-none resize-none min-h-[120px]"
              maxLength={500}
              placeholder="Share your reflection on this ayah… (min 6 characters)"
              value={composerBody}
              onChange={(e) => setComposerBody(e.target.value)}
            />

            {aiQuestions.length > 0 && (
              <div className="mt-3 rounded-xl border border-[var(--gold-border)] bg-[var(--gold-dim)] p-4 space-y-2">
                <p className="text-xs font-semibold tracking-widest uppercase text-[var(--gold)] mb-2">✦ Deepen your reflection</p>
                {aiQuestions.map((q, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[var(--gold)] mt-0.5">•</span>
                    <textarea
                      className="flex-1 bg-transparent text-sm leading-6 text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none resize-none"
                      value={q}
                      rows={2}
                      onChange={(e) => setAiQuestions((qs) => qs.map((_, idx) => idx === i ? e.target.value : _))}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => void handleAiDeepen()}
                disabled={aiLoading || !composerBody.trim() || composerBody.trim().length < 6}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--gold-border)] bg-[var(--gold-dim)] px-3 py-2 text-xs text-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--ink)] transition-all disabled:opacity-40"
              >
                {aiLoading ? "✦ Thinking…" : "✦ Deepen with AI"}
              </button>
              <select
                className="flex-1 min-w-[140px] rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-sm text-[var(--text)] focus:outline-none"
                value={selectedLens}
                onChange={(e) => setSelectedLens(e.target.value as Lens)}
              >
                {LENSES.map((item) => <option key={item} value={item}>{LENS_LABELS[item]}</option>)}
              </select>
              <button type="button" onClick={() => void handleSubmitReflection()}
                disabled={submitting || composerBody.trim().length < 6}
                className="rounded-xl bg-[var(--gold)] px-5 py-2 text-sm font-semibold text-[var(--ink)] hover:scale-[1.02] transition-transform disabled:opacity-40 disabled:scale-100">
                {submitting ? "Posting…" : "Post Reflection"}
              </button>
            </div>
          </div>

        </main>
      </div>

      {/* Right panel */}
      <aside className={`
        xl:fixed xl:right-0 xl:top-0 xl:h-full xl:w-80 xl:border-l xl:border-white/6 xl:bg-[rgba(15,14,12,0.8)] xl:backdrop-blur-xl xl:z-20 xl:flex xl:flex-col xl:p-5 xl:gap-4
        ${rightPanelOpen ? "block fixed inset-y-0 right-0 z-40 w-full max-w-xs bg-[#161411] border-l border-white/8 p-5 overflow-y-auto" : "hidden xl:flex xl:flex-col"}
      `}>
        {rightPanelOpen && (
          <button type="button" onClick={() => setRightPanelOpen(false)} className="xl:hidden flex items-center gap-2 text-sm text-[var(--muted)] mb-4">
            ← Close
          </button>
        )}
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-[var(--muted)] mb-3">Circle Members</p>
          <p className="text-sm text-[var(--muted)] mb-4">{reflectedCount} of {uniqueMembers.length} today</p>
          <div className="space-y-2">
          {uniqueMembers.map((m) => (
              <div key={`${m.user_id}-${m.username}`} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/3 px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <Avatar name={m.username} active={m.has_reflected_today} size="sm" />
                  <div>
                    <p className="text-sm">{m.username}</p>
              
                  </div>
                </div>
                <span className={`h-2 w-2 rounded-full ${m.has_reflected_today ? "bg-[var(--gold)]" : "bg-white/15"}`} />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-auto pt-4 border-t border-white/8">
          <button type="button" onClick={() => setInviteOpen(true)}
            className="w-full rounded-xl border border-[var(--gold-border)] bg-[var(--gold-dim)] px-4 py-2.5 text-sm text-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--ink)] transition-all font-medium">
            + Invite Member
          </button>
        </div>
      </aside>
      {/* Sheets */}
      <Sheet open={inviteOpen} title="Invite to your circle" kicker="Invite" onClose={() => setInviteOpen(false)}>
        <div className="rounded-xl border border-[var(--gold-border)] bg-[var(--gold-dim)] px-4 py-5 text-center">
          <p className="font-mono text-2xl tracking-[0.3em] text-[var(--gold)]">{room?.invite_code ?? "------"}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" className="rounded-xl border border-white/10 bg-white/4 py-2.5 text-sm"
            onClick={() => room?.invite_code && navigator.clipboard.writeText(room.invite_code)}>
            Copy Code
          </button>
          <button type="button" className="rounded-xl bg-[var(--gold)] py-2.5 text-sm font-medium text-[var(--ink)]"
            onClick={() => room?.invite_code && navigator.share?.({ text: room.invite_code })}>
            Share
          </button>
        </div>
      </Sheet>

      <Sheet open={collectionSheetOpen} title="Add this ayah" kicker="Collections" onClose={() => setCollectionSheetOpen(false)}>
        {collections.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No collections yet — create one below.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {collections.map((c) => (
              <button key={c.id} type="button" onClick={() => setSelectedCollectionId(c.id)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm transition-all ${selectedCollectionId === c.id ? "border-[var(--gold-border)] bg-[var(--gold-dim)] text-[var(--gold)]" : "border-white/8 bg-white/3"}`}>
                <span>{c.name}</span>
                <span className="text-xs text-[var(--muted)]">{c.verse_count} ayahs</span>
              </button>
            ))}
          </div>
        )}
        <input
          className="w-full rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 text-sm placeholder:text-[var(--muted)] focus:outline-none"
          placeholder="Or create new collection…"
          value={newCollectionName}
          onChange={(e) => setNewCollectionName(e.target.value)}
        />
        <button type="button" onClick={() => void handleCollectionSave()} disabled={collectionLoading}
          className="w-full rounded-xl bg-[var(--gold)] py-2.5 text-sm font-medium text-[var(--ink)] disabled:opacity-40">
          {collectionLoading ? "Saving…" : "Save to Collection"}
        </button>
      </Sheet>

      <Sheet open={noteSheetOpen} title="Write a private note" kicker="Note" onClose={() => setNoteSheetOpen(false)}>
        <textarea
          className="w-full rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-sm placeholder:text-[var(--muted)] focus:outline-none min-h-[120px] resize-none"
          placeholder="Your private reflection on this ayah…"
          value={noteBody}
          onChange={(e) => setNoteBody(e.target.value)}
        />
        <button type="button" onClick={() => void handleSaveNote()} disabled={noteLoading || !noteBody.trim()}
          className="w-full rounded-xl bg-[var(--gold)] py-2.5 text-sm font-medium text-[var(--ink)] disabled:opacity-40">
          {noteLoading ? "Saving…" : "Save Note"}
        </button>
      </Sheet>
    </div>
  )
}
