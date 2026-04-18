"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { getAllSurahs } from "@/lib/qf-api"
import type { Surah } from "@/types/quran"
import { getTodayDayNumber } from "@/lib/circle-constants"

const CHAPTER_VERSE_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
  111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73,
  54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49,
  62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28,
  28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20,
  15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
]

interface SheetProps {
  open: boolean
  title: string
  kicker?: string
  onClose: () => void
  children: React.ReactNode
}

function Sheet({ open, title, kicker, onClose, children }: SheetProps) {
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

export function AyahSelector({
  currentVerseKey,
  onSelect,
}: {
  currentVerseKey: string
  onSelect: (verseKey: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [surahs, setSurahs] = useState<Surah[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null)
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getAllSurahs()
      .then((s) => { setSurahs(s); console.log("Surahs loaded:", s.length) })
      .finally(() => setLoading(false))
  }, [open])

  const filtered = useMemo(() => {
    if (!search.trim()) return surahs
    const q = search.toLowerCase()
    return surahs.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.nameArabic?.includes(q) ||
        String(s.number).includes(q)
    )
  }, [surahs, search])

  const handleSave = useCallback(async () => {
    if (!selectedSurah || !selectedVerse) return
    setSaving(true)
    const verseKey = `${selectedSurah.number}:${selectedVerse}`
    try {
      const res = await fetch("/api/circle/daily-ayah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verse_key: verseKey, is_auto: false }),
      })
      if (res.ok) {
        onSelect(verseKey)
        setOpen(false)
        setSelectedSurah(null)
        setSelectedVerse(null)
        setSearch("")
      }
    } finally {
      setSaving(false)
    }
  }, [selectedSurah, selectedVerse, onSelect])

  const handleAutoRotate = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/circle/daily-ayah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_auto: true }),
      })
      if (res.ok) {
        const data = await res.json()
        onSelect(data.verse_key)
        setOpen(false)
      }
    } finally {
      setSaving(false)
    }
  }, [onSelect])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-[var(--muted)] hover:border-[var(--gold-border)] hover:text-[var(--gold)] transition-all"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        Set Ayah
      </button>

      <Sheet open={open} title="Set Today's Ayah" kicker="Admin" onClose={() => setOpen(false)}>
        <div className="space-y-4">
          {/* Current ayah */}
          <div className="rounded-xl border border-[var(--gold-border)] bg-[var(--gold-dim)] px-4 py-3">
            <p className="text-xs text-[var(--muted)]">Current</p>
            <p className="text-sm font-medium text-[var(--gold)]">{currentVerseKey}</p>
          </div>

          {/* Auto-rotate */}
          <button
            type="button"
            onClick={() => void handleAutoRotate()}
            disabled={saving}
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-left text-sm hover:border-white/20 transition-all disabled:opacity-40"
          >
            <div>
              <p className="font-medium">Auto-rotate</p>
              <p className="text-xs text-[var(--muted)]">Day {getTodayDayNumber()} % 6236 + 1</p>
            </div>
            <span className="text-xs text-[var(--gold)]">Day-based</span>
          </button>

          <div className="relative">
            <input
              className="w-full rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 pr-10 text-sm placeholder:text-[var(--muted)] focus:border-white/20 focus:outline-none"
              placeholder="Search surah by name or number…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedSurah(null) }}
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>

          {loading ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
             {[0,1,2,3,4].map(i => <div key={`skeleton-${i}`} className="skeleton h-10 rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {filtered.map((surah) => (
                <button
                  key={`surah-${surah.id}`}
                  type="button"
                  onClick={() => { setSelectedSurah(surah); setSelectedVerse(null); setSearch("") }}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm transition-all ${selectedSurah?.id === surah.id ? "border border-[var(--gold-border)] bg-[var(--gold-dim)] text-[var(--gold)]" : "border border-transparent bg-white/4 hover:bg-white/8"}`}
                >
                  <span>{surah.number}. {surah.name}</span>
                  <span className="text-xs text-[var(--muted)]">{CHAPTER_VERSE_COUNTS[surah.number - 1]} ayahs</span>
                </button>
              ))}
            </div>
          )}

          {selectedSurah && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--muted)]">
                Pick verse for {selectedSurah.name} (1–{CHAPTER_VERSE_COUNTS[selectedSurah.number - 1]}):
              </p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {Array.from({ length: Math.min(CHAPTER_VERSE_COUNTS[selectedSurah.number - 1], 20) }, (_, i) => i + 1).map((n) => (
                  <button
                  key={`verse-${selectedSurah?.id}-${n}`}
                    type="button"
                    onClick={() => setSelectedVerse(n)}
                    className={`h-9 w-12 rounded-xl border text-sm transition-all ${selectedVerse === n ? "border-[var(--gold-border)] bg-[var(--gold-dim)] text-[var(--gold)]" : "border-white/10 bg-white/4 hover:border-white/20"}`}
                  >
                    {n}
                  </button>
                ))}
                {CHAPTER_VERSE_COUNTS[selectedSurah.number - 1] > 20 && (
                  <div className="w-full">
                    <p className="text-xs text-[var(--muted)] mb-1.5">
                      Enter verse number (21 – {CHAPTER_VERSE_COUNTS[selectedSurah.number - 1]}):
                    </p>
                    <input
                      type="number"
                      min={1}
                      max={CHAPTER_VERSE_COUNTS[selectedSurah.number - 1]}
                      placeholder={`21 – ${CHAPTER_VERSE_COUNTS[selectedSurah.number - 1]}`}
                      className="w-28 rounded-xl border border-white/10 bg-white/4 px-3 py-1.5 text-sm placeholder:text-[var(--muted)] focus:border-white/20 focus:outline-none"
                      onChange={(e) => setSelectedVerse(Number(e.target.value))}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !selectedSurah || !selectedVerse}
            className="w-full rounded-xl bg-[var(--gold)] py-2.5 text-sm font-medium text-[var(--ink)] disabled:opacity-40"
          >
            {saving ? "Saving…" : "Set Today's Ayah"}
          </button>
        </div>
      </Sheet>
    </>
  )
}