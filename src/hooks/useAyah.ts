"use client"

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

async function fetchWithRetry<T>(fn: () => Promise<T | null>, retries = 3, delayMs = 2000): Promise<T | null> {
  for (let i = 0; i < retries; i++) {
    const result = await fn().catch(() => null)
    if (result) return result
    if (i < retries - 1) await new Promise(r => setTimeout(r, delayMs))
  }
  return null
}

export function useAyah(overrideVerseKey?: string) {
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
  const defaultVerseKey = useMemo(() => getTodayVerseKey(), [])
  const verseKey = overrideVerseKey ?? defaultVerseKey
  const lens = useMemo(() => getTodayLens(), [])

  const fetchVerse = useCallback(async () => {
    setLoading(true)
    setError(null)

    // Skip cache when override is provided and differs from default — always fetch fresh
    const isOverride = Boolean(overrideVerseKey)
    const cacheKey = `${AYAH_CACHE_PREFIX}:${overrideVerseKey ?? dateKey}`
    if (typeof window !== "undefined" && !isOverride) {
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

    // Retry up to 3 times — QF pre-prod is flaky
    const [verseData, audioData] = await Promise.all([
      fetchWithRetry(() => fetchVerseByKey(verseKey)),
      fetchWithRetry(() => fetchAudio(verseKey)),
    ])

    if (!verseData) {
      setError("We couldn't load today's ayah. Please refresh.")
      setLoading(false)
      return null
    }

    const chapterNumber = Number(verseKey.split(":")[0] ?? "1")
    const chapterData = await fetchWithRetry(() => fetchChapter(chapterNumber))

    setVerse(verseData)
    setChapter(chapterData)
    setAudio(audioData)
    setTafsir(null) // reset tafsir when verse changes

    if (typeof window !== "undefined") {
      // Clear any stale tafsir cache when verse key changes
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(TAFSIR_CACHE_PREFIX)) {
          localStorage.removeItem(key)
        }
      })
    }

    if (typeof window !== "undefined" && !isOverride) {
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
  }, [dateKey, verseKey, overrideVerseKey])

  const fetchTafsirForToday = useCallback(async () => {
    if (tafsir) return tafsir

    setTafsirLoading(true)
    const cacheKey = `${TAFSIR_CACHE_PREFIX}:${verseKey}`

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

    // Try tafsir 169 first, fall back to 168
    let tafsirData = await fetchWithRetry(() => fetchTafsir(verseKey, 169))
    if (!tafsirData) {
      tafsirData = await fetchWithRetry(() => fetchTafsir(verseKey, 168))
    }

    if (!tafsirData) {
      setTafsirLoading(false)
      return null
    }

    setTafsir(tafsirData)
    if (typeof window !== "undefined") {
      localStorage.setItem(cacheKey, JSON.stringify(tafsirData))
    }
    setTafsirLoading(false)
    return tafsirData
  }, [verseKey, tafsir])

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