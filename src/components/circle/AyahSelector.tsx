"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { getAllSurahs } from "@/lib/qf-api"
import type { Surah } from "@/types/quran"
import { getTodayDayNumber } from "@/lib/circle-constants"
import styles from "./ayah-selector.module.css"

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
      <button
        type="button"
        className={styles.backdrop}
        onClick={onClose}
        aria-label="Close"
      />
      <div className={styles.panel}>
        <div className={styles.dragHandle} />
        {kicker && <p className={styles.kicker}>{kicker}</p>}
        <h3 className={styles.sheetTitle}>{title}</h3>
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
      .then((s) => { setSurahs(s) })
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
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={styles.triggerBtn}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        Set Ayah
      </button>

      <Sheet open={open} title="Set Today's Ayah" kicker="Admin" onClose={() => setOpen(false)}>
        <div className={styles.body}>

          {/* Current ayah */}
          <div className={styles.currentBanner}>
            <p className={styles.currentLabel}>Current</p>
            <p className={styles.currentValue}>{currentVerseKey}</p>
          </div>

          {/* Auto-rotate */}
          <button
            type="button"
            onClick={() => void handleAutoRotate()}
            disabled={saving}
            className={styles.autoBtn}
          >
            <div>
              <p className={styles.autoBtnLabel}>Auto-rotate</p>
              <p className={styles.autoBtnSub}>Day {getTodayDayNumber()} % 6236 + 1</p>
            </div>
            <span className={styles.autoBtnBadge}>Day-based</span>
          </button>

          {/* Search */}
          <div className={styles.searchWrapper}>
            <input
              className={styles.searchInput}
              placeholder="Search surah by name or number…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedSurah(null) }}
            />
            <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>

          {/* Surah list */}
          {loading ? (
            <div className={styles.skeletonList}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={`skeleton-${i}`} className={styles.skeletonRow} />
              ))}
            </div>
          ) : (
            <div className={styles.surahList}>
              {filtered.map((surah) => (
                <button
                  key={`surah-${surah.id}`}
                  type="button"
                  onClick={() => { setSelectedSurah(surah); setSelectedVerse(null); setSearch("") }}
                  className={[
                    styles.surahBtn,
                    selectedSurah?.id === surah.id ? styles.surahBtnActive : "",
                  ].join(" ")}
                >
                  <span>{surah.number}. {surah.name}</span>
                  <span className={styles.surahBtnAyahCount}>
                    {CHAPTER_VERSE_COUNTS[surah.number - 1]} ayahs
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Verse picker */}
          {selectedSurah && (
            <div className={styles.versePicker}>
              <p className={styles.versePickerLabel}>
                Pick verse for {selectedSurah.name} (1–{CHAPTER_VERSE_COUNTS[selectedSurah.number - 1]}):
              </p>
              <div className={styles.verseGrid}>
                {Array.from(
                  { length: Math.min(CHAPTER_VERSE_COUNTS[selectedSurah.number - 1], 20) },
                  (_, i) => i + 1
                ).map((n) => (
                  <button
                    key={`verse-${selectedSurah?.id}-${n}`}
                    type="button"
                    onClick={() => setSelectedVerse(n)}
                    className={[
                      styles.verseBtn,
                      selectedVerse === n ? styles.verseBtnActive : "",
                    ].join(" ")}
                  >
                    {n}
                  </button>
                ))}

                {CHAPTER_VERSE_COUNTS[selectedSurah.number - 1] > 20 && (
                  <div className={styles.verseInputWrap}>
                    <p className={styles.verseInputLabel}>
                      Enter verse number (21 – {CHAPTER_VERSE_COUNTS[selectedSurah.number - 1]}):
                    </p>
                    <input
                      type="number"
                      min={1}
                      max={CHAPTER_VERSE_COUNTS[selectedSurah.number - 1]}
                      placeholder={`21 – ${CHAPTER_VERSE_COUNTS[selectedSurah.number - 1]}`}
                      className={styles.verseInput}
                      onChange={(e) => setSelectedVerse(Number(e.target.value))}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Save */}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !selectedSurah || !selectedVerse}
            className={styles.saveBtn}
          >
            {saving ? "Saving…" : "Set Today's Ayah"}
          </button>

        </div>
      </Sheet>
    </>
  )
}