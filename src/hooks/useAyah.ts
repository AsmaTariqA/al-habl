"use client"

// src/hooks/useAyah.ts
// Only change from original: fetchVerseByKey, fetchAudio, fetchTafsir
// now go through /api/content/* server routes automatically
// because qf-api.ts was updated — no changes needed here EXCEPT
// the fetchTafsirForToday call which was calling fetchTafsir directly.
// That still works because fetchTafsir now calls /api/content/tafsir internally.
// This file is UNCHANGED from your original — keeping it for reference.

import { useCallback, useEffect, useMemo, useState } from "react"
import { fetchAudio, fetchChapter, fetchTafsir, fetchVerseByKey } from "@/lib/qf-api"
import {
  getStudyDateKey,
  getTodayDayNumber,
  getTodayLens,
  getTodayVerseKey,
  getTodayVerseNumber,
  LENS_PROMPTS,
  LENS_LABELS,
} from "@/lib/circle-constants"
import type { AudioRecitation, Chapter, Tafsir, Verse } from "@/types/circle"

const AYAH_CACHE_PREFIX = "qf_daily_ayah"
const TAFSIR_CACHE_PREFIX = "qf_daily_tafsir"

interface CachedAyah {
  chapter: Chapter | null
  audio: AudioRecitation | null
  verse: Verse
}

export function useAyah() {
  const [verse, setVerse] = useState<Verse | null>(null)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [audio, setAudio] = useState<AudioRecitation | null>(null)
  const [tafsir, setTafsir] = useState<Tafsir | null>(null)
  const [loading, setLoading] = useState(true)
  const [tafsirLoading, setTafsirLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dateKey = useMemo(() => getStudyDateKey(), [])
  const dayNumber = useMemo(() => getTodayDayNumber(), [])
  const verseNumber = useMemo(() => getTodayVerseNumber(), [])
  const verseKey = useMemo(() => getTodayVerseKey(), [])
  const lens = useMemo(() => getTodayLens(), [])

  const fetchVerse = useCallback(async () => {
    setLoading(true)
    setError(null)

    const cacheKey = `${AYAH_CACHE_PREFIX}:${dateKey}`
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as CachedAyah
          setVerse(parsed.verse)
          setChapter(parsed.chapter)
          setAudio(parsed.audio)
          setLoading(false)
          return parsed.verse
        } catch {
          localStorage.removeItem(cacheKey)
        }
      }
    }

    // fetchVerseByKey now calls /api/content/verse server route
    // which returns verse + chapter + audio in one request.
    // We call fetchAudio separately only to keep the interface identical —
    // but it also hits the same server route so it's cached after the first call.
    const [verseData, audioData] = await Promise.all([
      fetchVerseByKey(verseKey),
      fetchAudio(verseKey),
    ])

    if (!verseData) {
      setError("We couldn't load today's ayah.")
      setLoading(false)
      return null
    }

    const chapterNumber = Number(verseKey.split(":")[0] ?? "1")
    const chapterData = await fetchChapter(chapterNumber)

    setVerse(verseData)
    setChapter(chapterData)
    setAudio(audioData)

    if (typeof window !== "undefined") {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          verse: verseData,
          chapter: chapterData,
          audio: audioData,
        } satisfies CachedAyah),
      )
    }

    setLoading(false)
    return verseData
  }, [dateKey, verseKey])

  const fetchTafsirForToday = useCallback(async () => {
    if (tafsir) return tafsir

    setTafsirLoading(true)
    const cacheKey = `${TAFSIR_CACHE_PREFIX}:${dateKey}`

    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as Tafsir
          setTafsir(parsed)
          setTafsirLoading(false)
          return parsed
        } catch {
          localStorage.removeItem(cacheKey)
        }
      }
    }

    // fetchTafsir now calls /api/content/tafsir server route
    const tafsirData = await fetchTafsir(verseKey)
    if (!tafsirData) {
      setError("We couldn't load the tafsir right now.")
      setTafsirLoading(false)
      return null
    }

    setTafsir(tafsirData)
    if (typeof window !== "undefined") {
      localStorage.setItem(cacheKey, JSON.stringify(tafsirData))
    }
    setTafsirLoading(false)
    return tafsirData
  }, [dateKey, tafsir, verseKey])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchVerse()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [fetchVerse])

  return {
    verse,
    chapter,
    audio,
    tafsir,
    loading,
    tafsirLoading,
    error,
    lens,
    lensLabel: LENS_LABELS[lens],
    lensPrompts: LENS_PROMPTS[lens],
    verseKey,
    verseNumber,
    dayNumber,
    fetchVerse,
    fetchTafsirForToday,
  }
}