"use client"

import { useEffect, useState } from "react"
import { getAllSurahs } from "@/lib/qf-api"
import { Surah } from "@/types/quran"

interface SurahPickerProps {
  onSelect: (surah: Surah) => void
  loading?: boolean
}

export function SurahPicker({ onSelect, loading = false }: SurahPickerProps) {
  const [surahs, setSurahs] = useState<Surah[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        setIsLoading(true)
        const data = await getAllSurahs()
        setSurahs(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load surahs")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSurahs()
  }, [])

  const filtered = surahs.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.nameArabic.includes(search) ||
      s.number.toString().includes(search)
  )

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "3rem 1rem" }}>
        <p style={{ color: "var(--muted)" }}>Loading Surahs…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          padding: "1rem",
          border: "1px solid var(--glass-border)",
          borderRadius: "12px",
          color: "var(--text)",
          background: "var(--glass)",
        }}
      >
        {error}
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* SEARCH */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search surah…"
        className="input-field"
        style={{
          background: "var(--glass)",
          border: "1px solid var(--glass-border)",
        }}
      />

      {/* LIST */}
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {filtered.map((surah) => (
          <button
            key={surah.number}
            onClick={() => onSelect(surah)}
            disabled={loading}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "1rem",
              borderRadius: "12px",

              // 🔥 FULL THEME SAFE STYLING
              background: "var(--glass)",
              border: "1px solid var(--glass-border)",
              color: "var(--text)",

              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "var(--glass-strong)"
                e.currentTarget.style.borderColor = "var(--gold-border)"
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--glass)"
              e.currentTarget.style.borderColor = "var(--glass-border)"
            }}
          >
            {/* LEFT */}
            <div>
              <p style={{ fontWeight: 600 }}>{surah.name}</p>
              <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                {surah.numberOfAyahs} verses
              </p>
            </div>

            {/* RIGHT ARABIC */}
            <p
              style={{
                fontFamily: "var(--font-arabic)",
                color: "var(--gold)",
                fontSize: "1.25rem",
              }}
            >
              {surah.nameArabic}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}