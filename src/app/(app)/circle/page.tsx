"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/circle/AppShell"
import { useAyah } from "@/hooks/useAyah"
import { useCircle } from "@/hooks/useCircle"
import { getClientAccessToken } from "@/lib/client-access"
import { addToCollection, bookmarkVerse, createCollection, createNote, getCollections, getStreaks } from "@/lib/qf-api"
import { LENSES, LENS_LABELS, LENS_PROMPTS, getTodayLens, type Lens } from "@/lib/circle-constants"
import { session } from "@/lib/session"
import { AyahSelector } from "@/components/circle/AyahSelector"
import type { VerseCollection } from "@/types/circle"

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
  const dim = size === "sm" ? 32 : size === "lg" ? 56 : 40
  const fs = size === "sm" ? "0.7rem" : size === "lg" ? "0.9rem" : "0.75rem"
  return (
    <div style={{ width: dim, height: dim, flexShrink: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: fs, fontWeight: 600, background: active ? 'var(--gold-dim2)' : 'var(--glass-strong)', border: `1px solid ${active ? 'var(--gold-border)' : 'var(--glass-border)'}`, color: active ? 'var(--gold)' : 'var(--muted)', boxShadow: active ? '0 0 10px rgba(201,168,76,0.2)' : 'none', transition: 'all 0.2s ease' }}>
      {getInitials(name)}
    </div>
  )
}

function FeedSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ padding: '1.25rem', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="skeleton" style={{ height: '0.75rem', width: '7rem', borderRadius: '99px' }} />
              <div className="skeleton" style={{ height: '0.65rem', width: '4rem', borderRadius: '99px' }} />
            </div>
            <div className="skeleton" style={{ height: '1.25rem', width: '5rem', borderRadius: '99px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {['100%','88%','72%'].map((w,i) => <div key={i} className="skeleton" style={{ height: '0.75rem', width: w, borderRadius: '99px' }} />)}
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
      <button type="button" aria-label="Close" onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', cursor: 'pointer', border: 'none' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, margin: '0 auto', maxWidth: '32rem', borderRadius: '28px 28px 0 0', borderTop: '1px solid var(--glass-border)', background: 'var(--ink-raised)', padding: '1.5rem 1.5rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 -12px 40px rgba(0,0,0,0.25)' }}>
        <div style={{ width: '40px', height: '4px', borderRadius: '99px', background: 'var(--glass-border)', margin: '0 auto' }} />
        {kicker && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>{kicker}</span>}
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.03em', marginTop: kicker ? '-0.75rem' : 0 }}>{title}</h3>
        {children}
      </div>
    </>
  )
}

const iconBtnStyle: React.CSSProperties = { width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: 'var(--glass-strong)', color: 'var(--muted)', cursor: 'pointer', transition: 'all 0.15s ease', flexShrink: 0 }

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
  const [selectedOverrideVerseKey, setSelectedOverrideVerseKey] = useState<string | undefined>(undefined)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const { verse, chapter, audio, tafsir, loading: ayahLoading, tafsirLoading, error: ayahError, lens, verseKey, dayNumber, fetchVerse, fetchTafsirForToday } = useAyah(selectedOverrideVerseKey)
  const { room, members, posts, commentsByPost, loadingComments, loading, submitting, error, postReflection, likePost, loadComments, addComment } = useCircle(roomId)

  const activeTranslation = !verse?.translations.length ? null : !selectedTranslationId ? verse.translations[0] : verse.translations.find((t) => t.id === selectedTranslationId) ?? verse.translations[0]

  const uniqueMembersMap = new Map()
  members.forEach((m) => { if (!uniqueMembersMap.has(m.user_id)) uniqueMembersMap.set(m.user_id, m) })
  const uniqueMembers = Array.from(uniqueMembersMap.values())
  const reflectedCount = uniqueMembers.filter((m) => m.has_reflected_today).length
  const selectedLensPrompts = LENS_PROMPTS[selectedLens]
  const featuredPrompt = selectedLensPrompts[(dayNumber - 1) % selectedLensPrompts.length]
useEffect(() => {
  if (roomId) return

  const existing = session.getRoomId()
  if (existing) { setRoomId(existing); return }

  fetch("/api/circle")
    .then(r => {
      if (!r.ok) return null
      return r.json()
    })
    .then((data: { room?: { id: string } | null } | null) => {
      if (!data) return // fetch failed — stay on page, don't redirect
      if (data.room?.id) {
        session.setRoomId(data.room.id)
        setRoomId(data.room.id)
        return
      }
      // Only redirect if we got a valid response but genuinely no room
      router.replace("/onboarding")
    })
    .catch(() => {
      // Network error — don't redirect, user is logged in
    })
}, [roomId, router])

  useEffect(() => {
    getClientAccessToken().then(async (token) => {
      if (!token) return
      const streak = await getStreaks(token).catch(() => null)
      if (streak?.current_streak != null) setStreakCount(streak.current_streak)
    }).catch(() => null)
  }, [])

  useEffect(() => {
    if (!audio?.url) return
    const el = new Audio(audio.url); audioRef.current = el
    const onLoaded = () => { setDuration(el.duration); setAudioReady(true) }
    const onTimeUpdate = () => setCurrentTime(el.currentTime)
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0) }
    el.addEventListener("loadedmetadata", onLoaded); el.addEventListener("timeupdate", onTimeUpdate); el.addEventListener("ended", onEnded)
    return () => { el.pause(); el.removeEventListener("loadedmetadata", onLoaded); el.removeEventListener("timeupdate", onTimeUpdate); el.removeEventListener("ended", onEnded) }
  }, [audio?.url])

  useEffect(() => {
    if (!collectionSheetOpen) return
    getClientAccessToken().then(async (token) => {
      if (!token) return
      const items = await getCollections(token).catch(() => null); setCollections(items ?? [])
    }).catch(() => null)
  }, [collectionSheetOpen])

  async function toggleAudio() {
    if (!audioRef.current) return
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); return }
    await audioRef.current.play(); setIsPlaying(true)
  }

  async function handleBookmark() {
    setBookmarkLoading(true)
    try { const token = await getClientAccessToken(); if (!token) { setActionMessage("Not logged in."); return }; const saved = await bookmarkVerse(token, verseKey).catch(() => null); setActionMessage(saved ? "Ayah bookmarked ✓" : "Bookmarking unavailable right now") }
    catch { setActionMessage("Bookmarking unavailable right now") }
    finally { setBookmarkLoading(false); setTimeout(() => setActionMessage(null), 2500) }
  }

  async function handleCollectionSave() {
    setCollectionLoading(true)
    try {
      const token = await getClientAccessToken(); if (!token) { setActionMessage("Not logged in."); return }
      let id = selectedCollectionId
      if (!id && newCollectionName.trim()) { const created = await createCollection(token, newCollectionName.trim()).catch(() => null); id = created?.id ?? null }
      if (!id) { setActionMessage("Choose or create a collection first."); return }
      const added = await addToCollection(token, id, verseKey).catch(() => null)
      setCollectionSheetOpen(false); setSelectedCollectionId(null); setNewCollectionName("")
      setActionMessage(added ? "Added to collection ✓" : "Collections unavailable right now")
    } catch { setActionMessage("Collections unavailable right now") }
    finally { setCollectionLoading(false); setTimeout(() => setActionMessage(null), 2500) }
  }

  async function handleSaveNote() {
    setNoteLoading(true)
    try { const token = await getClientAccessToken(); if (!token) { setActionMessage("Not logged in."); return }; const saved = await createNote(token, verseKey, noteBody.trim()).catch(() => null); if (saved) { setNoteBody(""); setNoteSheetOpen(false); setActionMessage("Note saved ✓") } else setActionMessage("Notes unavailable right now") }
    catch { setActionMessage("Notes unavailable right now") }
    finally { setNoteLoading(false); setTimeout(() => setActionMessage(null), 2500) }
  }

  async function handleExpandAyah() { const next = !ayahExpanded; setAyahExpanded(next); if (next && !tafsir) await fetchTafsirForToday() }

  async function handleSubmitReflection() {
    const body = composerBody.trim()
    if (body.length < 15) { setActionMessage("Reflection must be at least 15 characters."); return }
    const created = await postReflection(body, selectedLens)
    if (created) { setComposerBody(""); setSelectedLens(lens); setAiQuestions([]) }
  }

  async function toggleComments(postId: string) { const next = !commentsOpen[postId]; setCommentsOpen(c => ({ ...c, [postId]: next })); if (next) await loadComments(postId) }
  async function submitComment(postId: string) { const body = commentDrafts[postId]?.trim(); if (!body) return; const created = await addComment(postId, body); if (created) setCommentDrafts(c => ({ ...c, [postId]: "" })) }

  const cardBg: React.CSSProperties = { background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)' }
  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.65rem 1rem', background: 'var(--glass-strong)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', lineHeight: 1.65, outline: 'none', transition: 'border-color 0.15s ease' }

  // Right panel content — passed to AppShell
  const rightPanelContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', padding: '1.25rem' }}>
      <div style={{ flex: 1 }}>
        <span className="muted-kicker" style={{ display: 'flex', marginBottom: '0.5rem' }}>Circle Members</span>
        <p style={{ fontSize: '0.825rem', color: 'var(--muted)', marginBottom: '1rem' }}>{reflectedCount} of {uniqueMembers.length} reflected today</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {uniqueMembers.map(m => (
            <div key={`${m.user_id}-${m.username}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.875rem', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Avatar name={m.username} active={m.has_reflected_today} size="sm" />
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)', letterSpacing: '-0.01em' }}>{m.username}</p>
              </div>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: m.has_reflected_today ? 'var(--gold)' : 'var(--glass-border)', boxShadow: m.has_reflected_today ? '0 0 5px var(--gold)' : 'none' }} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
        <button type="button" onClick={() => setInviteOpen(true)} className="button-secondary" style={{ width: '100%' }}>+ Invite Member</button>
      </div>
    </div>
  )

  return (
    <AppShell pageLabel="Circle" rightPanel={rightPanelContent}>
      {/* Ambient */}
      <div aria-hidden style={{ position: 'fixed', inset: 'auto 0 auto 0', top: 0, height: '320px', zIndex: 0, background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(201,168,76,0.10), transparent)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Mobile header */}
        <header className="lg:hidden" style={{ position: 'sticky', top: 0, zIndex: 30, padding: '0.65rem 1rem 0.5rem', background: 'color-mix(in srgb, var(--ink) 88%, transparent)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', color: 'var(--gold)', textTransform: 'uppercase' }}>Al-Habl</p>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, letterSpacing: '-0.02em' }}>{room?.name ?? "Your Circle"}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button type="button" onClick={() => setRightPanelOpen(!rightPanelOpen)} style={{ ...iconBtnStyle, width: 'auto', padding: '0.35rem 0.7rem', fontSize: '0.75rem', color: 'var(--muted)' }}>Members</button>
              {streakCount !== null && (
                <div style={{ padding: '0.25rem 0.6rem', borderRadius: '99px', border: '1px solid var(--gold-border)', background: 'var(--gold-dim)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
                  {streakCount}d 🔥
                </div>
              )}
              <button type="button" aria-label="Log out" style={iconBtnStyle}
                onClick={async () => { if (!window.confirm("Log out?")) return; await fetch("/api/auth/logout", { method: "POST" }); localStorage.clear(); window.location.href = "/auth/login" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round"/><polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round"/></svg>
              </button>
            </div>
          </div>
        </header>

        {/* Desktop title bar */}
        <div className="hidden lg:flex" style={{ alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 2rem 0.75rem', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.04em', marginBottom: '0.2rem' }}>Today&apos;s Circle</h1>
            <p style={{ fontSize: '0.825rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Day {dayNumber} · {verseKey}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button type="button" onClick={() => setInviteOpen(true)} className="button-secondary" style={{ fontSize: '0.825rem', padding: '0.5rem 1rem' }}>+ Invite Members</button>
            <AyahSelector currentVerseKey={verseKey} onSelect={(vk) => { if (typeof window !== "undefined") localStorage.removeItem(`qf_daily_ayah:${vk}`); setSelectedOverrideVerseKey(vk); setTimeout(() => void fetchVerse(), 0) }} />
          </div>
        </div>

        <main style={{ padding: '1rem 1rem 6rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="lg:px-8">

          {/* Ayah card */}
          <div style={{ ...cardBg, overflow: 'hidden' }}>
            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', opacity: 0.35 }} />
            <div style={{ padding: '1.25rem 1.5rem' }} className="lg:p-7">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>{chapter?.name_simple ?? "…"} · {verseKey} · Day {dayNumber}</p>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {[
                    { label: 'Bookmark', onClick: handleBookmark, disabled: bookmarkLoading, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 4h10v16l-5-4-5 4V4Z"/></svg> },
                    { label: 'Collection', onClick: () => setCollectionSheetOpen(true), disabled: false, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="5" width="6" height="6" rx="1.5"/><rect x="14" y="5" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/></svg> },
                    { label: 'Note', onClick: () => setNoteSheetOpen(true), disabled: false, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 4h10a2 2 0 0 1 2 2v12l-4-3H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg> },
                  ].map(btn => (
                    <button key={btn.label} type="button" aria-label={btn.label} onClick={btn.onClick} disabled={btn.disabled} style={iconBtnStyle}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gold-border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--gold)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--glass-border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)' }}>
                      {btn.icon}
                    </button>
                  ))}
                </div>
              </div>

              {ayahLoading ? <div className="skeleton" style={{ height: '5rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }} />
                : <p dir="rtl" translate="no" style={{ fontFamily: 'var(--font-arabic)', textAlign: 'right', fontSize: 'clamp(1.5rem, 4vw, 2rem)', lineHeight: 2.1, marginBottom: '1rem', color: 'var(--text)' }}>{verse?.text_uthmani}</p>}

              <div className="divider" style={{ marginBottom: '1rem' }} />

              {ayahLoading
                ? <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1.25rem' }}>{['100%','88%','68%'].map((w,i) => <div key={i} className="skeleton" style={{ height: '0.75rem', width: w, borderRadius: '99px' }} />)}</div>
                : <p style={{ fontSize: '0.9rem', lineHeight: 1.85, color: 'var(--muted)', marginBottom: '1.25rem', fontStyle: 'italic' }}>{activeTranslation?.text}</p>}

              {/* Audio */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <button type="button" onClick={toggleAudio} disabled={!audioReady}
                  style={{ width: 40, height: 40, flexShrink: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gold)', color: '#0F0E0C', border: 'none', cursor: audioReady ? 'pointer' : 'not-allowed', opacity: audioReady ? 1 : 0.4, transition: 'transform 0.15s ease' }}
                  onMouseEnter={e => { if (audioReady) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.06)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}>
                  {isPlaying ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 6h3v12H8zM13 6h3v12h-3z"/></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="m8 6 10 6-10 6V6Z"/></svg>}
                </button>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ flex: 1, height: '5px', borderRadius: '99px', background: 'var(--glass-strong)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--gold)', borderRadius: '99px', transition: 'width 0.1s linear', width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }} />
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{formatTime(currentTime)} / {formatTime(duration)}</p>
                </div>
              </div>

              {actionMessage && <p style={{ fontSize: '0.8rem', color: 'var(--gold)', marginBottom: '0.75rem' }}>{actionMessage}</p>}
              {ayahError && <div style={{ textAlign: 'center', padding: '1rem 0' }}><p style={{ fontSize: '0.8rem', color: '#f87171', marginBottom: '0.5rem' }}>{ayahError}</p><button onClick={() => void fetchVerse()} style={{ fontSize: '0.8rem', color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Try again</button></div>}

              <button type="button" onClick={() => void handleExpandAyah()}
                style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 1rem', background: 'var(--glass-strong)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--muted)', cursor: 'pointer', transition: 'border-color 0.15s ease, color 0.15s ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gold-border)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--glass-border)' }}>
                <span>View tafsir & word-by-word</span>
                <span style={{ color: 'var(--gold)' }}>{ayahExpanded ? "↑" : "↓"}</span>
              </button>

              {ayahExpanded && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ padding: '1rem', background: 'var(--glass-strong)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span className="muted-kicker" style={{ display: 'flex' }}>Ibn Kathir</span>
                      {tafsirLoading && <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Loading…</span>}
                    </div>
                    {tafsirLoading ? <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>{['100%','90%','75%'].map((w,i) => <div key={i} className="skeleton" style={{ height: '0.75rem', width: w, borderRadius: '99px' }} />)}</div>
                      : <p style={{ fontSize: '0.875rem', lineHeight: 1.8, color: 'var(--muted)' }}>{tafsir?.text ?? "Tafsir not available for this verse."}</p>}
                  </div>
                  {!ayahLoading && verse?.words && (
                    <div style={{ padding: '1rem', background: 'var(--glass-strong)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                      <span className="muted-kicker" style={{ display: 'flex', marginBottom: '0.75rem' }}>Word by word</span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                        {verse.words.map(word => (
                          <div key={word.position} style={{ padding: '0.6rem', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                            <p dir="rtl" translate="no" style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.1rem', color: 'var(--text)', marginBottom: '0.35rem' }}>{word.text_uthmani}</p>
                            <p style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{word.translation.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {verse?.translations && verse.translations.length > 1 && (
                    <div style={{ padding: '1rem', background: 'var(--glass-strong)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                        {verse.translations.map(t => (
                          <button key={t.id} type="button" onClick={() => setSelectedTranslationId(t.id)}
                            style={{ padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', cursor: 'pointer', border: `1px solid ${selectedTranslationId === t.id ? 'var(--gold-border)' : 'var(--glass-border)'}`, background: selectedTranslationId === t.id ? 'var(--gold-dim)' : 'var(--glass)', color: selectedTranslationId === t.id ? 'var(--gold)' : 'var(--muted)', transition: 'all 0.15s ease' }}>
                            {t.resource_name}
                          </button>
                        ))}
                      </div>
                      <p style={{ fontSize: '0.875rem', lineHeight: 1.8, color: 'var(--muted)' }}>{activeTranslation?.text}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Lenses */}
          <div style={{ ...cardBg, padding: '1.25rem' }}>
            <span className="muted-kicker" style={{ display: 'flex', marginBottom: '0.875rem' }}>Today&apos;s Lens</span>
            <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem', marginBottom: '1rem' }} className="scrollbar-none">
              {LENSES.map(item => (
                <button key={item} type="button" onClick={() => setSelectedLens(item)}
                  style={{ flexShrink: 0, padding: '0.4rem 0.875rem', borderRadius: 'var(--radius-sm)', fontSize: '0.825rem', cursor: 'pointer', border: `1px solid ${selectedLens === item ? 'var(--gold-border)' : 'var(--glass-border)'}`, background: selectedLens === item ? 'var(--gold-dim)' : 'var(--glass-strong)', color: selectedLens === item ? 'var(--gold)' : 'var(--muted)', transition: 'all 0.15s ease' }}>
                  {LENS_LABELS[item]}
                </button>
              ))}
            </div>
            <div style={{ padding: '1rem 1.25rem', background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', borderRadius: 'var(--radius-md)' }}>
              <span className="badge badge-gold" style={{ marginBottom: '0.75rem', display: 'inline-flex' }}>{LENS_LABELS[selectedLens]}</span>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.75, fontWeight: 500, color: 'var(--text)', marginBottom: '0.75rem' }}>{featuredPrompt}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {selectedLensPrompts.map(p => <p key={p} style={{ fontSize: '0.8rem', lineHeight: 1.6, color: 'var(--muted)' }}>↳ {p}</p>)}
              </div>
            </div>
          </div>

          {/* Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="muted-kicker" style={{ display: 'flex' }}>Reflections</span>
              {error && <p style={{ fontSize: '0.75rem', color: '#f87171' }}>{error}</p>}
            </div>
            {loading ? <FeedSkeleton /> : posts.length === 0 ? (
              <div style={{ padding: '2.5rem 2rem', textAlign: 'center', background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', borderRadius: 'var(--radius-lg)' }}>
                <p style={{ fontWeight: 600, color: 'var(--gold)', marginBottom: '0.35rem' }}>Be the first to reflect today</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Your circle is waiting for your reflection.</p>
              </div>
            ) : posts.map(post => (
              <article key={post.id} style={{ ...cardBg, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold-border)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--glass-border)'}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Avatar name={post.username} size="sm" />
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)', letterSpacing: '-0.01em' }}>{post.username}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{timeAgo(post.created_at)}</p>
                    </div>
                  </div>
                  <span className="badge badge-gold" style={{ flexShrink: 0 }}>{LENS_LABELS[(post.lens as Lens) ?? "relevance"]}</span>
                </div>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.8, color: 'var(--text-soft)' }}>{post.body}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button type="button" onClick={() => void likePost(post.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: post.liked_by_me ? 'var(--gold)' : 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s ease' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={post.liked_by_me ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5"><path d="M12 20s-7-4.3-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 10c0 5.7-7 10-7 10Z"/></svg>
                    <span>{post.like_count}</span>
                  </button>
                  <button type="button" onClick={() => void toggleComments(post.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s ease' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 6h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 3V8a2 2 0 0 1 2-2Z"/></svg>
                    <span>{post.comment_count}</span>
                  </button>
                </div>
                {commentsOpen[post.id] && (
                  <div style={{ padding: '0.875rem', background: 'var(--glass-strong)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {loadingComments[post.id] ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div className="skeleton" style={{ height: '0.75rem', width: '100%', borderRadius: '99px' }} />
                        <div className="skeleton" style={{ height: '0.75rem', width: '75%', borderRadius: '99px' }} />
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {(commentsByPost[post.id] ?? []).map(c => (
                          <div key={c.id}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.2rem' }}><span style={{ color: 'var(--text)', fontWeight: 500 }}>{c.username}</span>{' · '}{timeAgo(c.created_at)}</p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-soft)', lineHeight: 1.6 }}>{c.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input style={{ ...inputStyle, flex: 1 }} placeholder="Write a comment…" value={commentDrafts[post.id] ?? ""} onChange={e => setCommentDrafts(c => ({ ...c, [post.id]: e.target.value }))} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submitComment(post.id) } }} onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--gold-border)'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'var(--glass-border)'} />
                      <button type="button" onClick={() => void submitComment(post.id)}
                        style={{ padding: '0 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--gold-border)', background: 'var(--gold-dim)', color: 'var(--gold)', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.15s ease' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--gold)'; (e.currentTarget as HTMLButtonElement).style.color = '#0F0E0C' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--gold-dim)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--gold)' }}>→</button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>

          {/* Composer */}
          <div style={{ ...cardBg, padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
              <span className="muted-kicker" style={{ display: 'flex' }}>Your Reflection</span>
              <span style={{ fontSize: '0.75rem', color: composerBody.length > 480 ? '#f87171' : 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{composerBody.length}/500</span>
            </div>
            <textarea style={{ ...inputStyle, minHeight: '120px', resize: 'none', lineHeight: 1.75 }} maxLength={500} placeholder="Share your reflection on this ayah… (min 15 characters)" value={composerBody} onChange={e => setComposerBody(e.target.value)} onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--gold-border)'} onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--glass-border)'} />
            {aiQuestions.length > 0 && (
              <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>✦ Deepen your reflection</p>
                {aiQuestions.map((q, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--gold)', marginTop: '0.1rem', flexShrink: 0 }}>•</span>
                    <textarea style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.875rem', lineHeight: 1.65, color: 'var(--text)', resize: 'none', fontFamily: 'var(--font-sans)' }} value={q} rows={2} onChange={e => setAiQuestions(qs => qs.map((_, idx) => idx === i ? e.target.value : _))} />
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginTop: '0.875rem' }}>
              <select style={{ flex: 1, minWidth: '140px', ...inputStyle, width: 'auto' }} value={selectedLens} onChange={e => setSelectedLens(e.target.value as Lens)} onFocus={e => (e.target as HTMLSelectElement).style.borderColor = 'var(--gold-border)'} onBlur={e => (e.target as HTMLSelectElement).style.borderColor = 'var(--glass-border)'}>
                {LENSES.map(item => <option key={item} value={item}>{LENS_LABELS[item]}</option>)}
              </select>
              <button type="button" onClick={() => void handleSubmitReflection()} disabled={submitting || composerBody.trim().length < 15} className="button-primary" style={{ padding: '0.55rem 1.25rem' }}>
                {submitting ? "Posting…" : "Post Reflection"}
              </button>
            </div>
          </div>

        </main>

        {/* Mobile right panel overlay */}
        {rightPanelOpen && (
          <>
            <button type="button" aria-label="Close panel" onClick={() => setRightPanelOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 39, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', border: 'none', cursor: 'pointer' }} className="xl:hidden" />
            <div style={{ position: 'fixed', insetBlock: 0, right: 0, zIndex: 40, width: 'min(100%, 320px)', background: 'var(--ink-raised)', borderLeft: '1px solid var(--glass-border)', overflowY: 'auto' }} className="xl:hidden">
              <div style={{ padding: '1rem' }}>
                <button type="button" onClick={() => setRightPanelOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1rem' }}>← Close</button>
              </div>
              {rightPanelContent}
            </div>
          </>
        )}
      </div>

      {/* Sheets */}
      <Sheet open={inviteOpen} title="Invite to your circle" kicker="Invite" onClose={() => setInviteOpen(false)}>
        <div style={{ padding: '1.25rem', background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', letterSpacing: '0.25em', fontWeight: 700, color: 'var(--gold)' }}>{room?.invite_code ?? "------"}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <button type="button" className="button-secondary" onClick={() => room?.invite_code && navigator.clipboard.writeText(room.invite_code)}>Copy Code</button>
          <button type="button" className="button-primary" onClick={() => room?.invite_code && navigator.share?.({ text: room.invite_code })}>Share</button>
        </div>
      </Sheet>

      <Sheet open={collectionSheetOpen} title="Add this ayah" kicker="Collections" onClose={() => setCollectionSheetOpen(false)}>
        {collections.length === 0
          ? <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>No collections yet — create one below.</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '200px', overflowY: 'auto' }} className="scrollbar-none">
              {collections.map(c => (
                <button key={c.id} type="button" onClick={() => setSelectedCollectionId(c.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.875rem', border: `1px solid ${selectedCollectionId === c.id ? 'var(--gold-border)' : 'var(--glass-border)'}`, background: selectedCollectionId === c.id ? 'var(--gold-dim)' : 'var(--glass)', color: selectedCollectionId === c.id ? 'var(--gold)' : 'var(--text)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease' }}>
                  <span>{c.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{c.verse_count} ayahs</span>
                </button>
              ))}
            </div>}
        <input style={inputStyle} placeholder="Or create new collection…" value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)} onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--gold-border)'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'var(--glass-border)'} />
        <button type="button" onClick={() => void handleCollectionSave()} disabled={collectionLoading} className="button-primary" style={{ width: '100%' }}>{collectionLoading ? "Saving…" : "Save to Collection"}</button>
      </Sheet>

      <Sheet open={noteSheetOpen} title="Write a private note" kicker="Note" onClose={() => setNoteSheetOpen(false)}>
        <textarea style={{ ...inputStyle, minHeight: '120px', resize: 'none', lineHeight: 1.75 }} placeholder="Your private reflection on this ayah…" value={noteBody} onChange={e => setNoteBody(e.target.value)} onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--gold-border)'} onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--glass-border)'} />
        <button type="button" onClick={() => void handleSaveNote()} disabled={noteLoading || !noteBody.trim()} className="button-primary" style={{ width: '100%' }}>{noteLoading ? "Saving…" : "Save Note"}</button>
      </Sheet>
    </AppShell>
  )
}