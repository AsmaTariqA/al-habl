"use client"

import { useEffect, useMemo, useState } from "react"
import { getClientAccessToken } from "@/lib/client-access"
import { getBookmarks, getCollections, getNotes } from "@/lib/qf-api"
import type { Bookmark, Note, VerseCollection } from "@/types/circle"

type TabKey = "bookmarks" | "collections" | "notes"

export default function ArchivePage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [collections, setCollections] = useState<VerseCollection[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>("bookmarks")

  useEffect(() => {
    const loadArchive = async () => {
      const token = await getClientAccessToken()
      if (!token) {
        setLoading(false)
        return
      }

      const [bookmarkData, collectionData, noteData] = await Promise.all([
        getBookmarks(token),
        getCollections(token),
        getNotes(token),
      ])

      setBookmarks(bookmarkData ?? [])
      setCollections(collectionData ?? [])
      setNotes(noteData ?? [])
      setLoading(false)
    }

    void loadArchive()
  }, [])

  const tabCounts = useMemo(() => ({
    bookmarks: bookmarks.length,
    collections: collections.length,
    notes: notes.length,
  }), [bookmarks.length, collections.length, notes.length])

  const renderEmpty = (title: string, body: string) => (
    <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-dim)] p-10 text-center">
      <p className="text-base font-medium text-[var(--gold)]">{title}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">{body}</p>
    </div>
  )

  const renderSkeleton = () => (
    <div className="space-y-3">
      <div className="skeleton h-20 rounded-2xl" />
      <div className="skeleton h-20 rounded-2xl" />
      <div className="skeleton h-20 rounded-2xl" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--ink)] pb-24 text-[var(--text)]">
      <main className="mx-auto w-full max-w-5xl px-4 pt-8 space-y-6">

        {/* Header */}
        <section className="glass-card p-6 sm:p-8 space-y-3">
          <p className="muted-kicker">Archive</p>
          <h1 className="text-3xl sm:text-4xl font-semibold">
            Saved for later return
          </h1>
          <p className="text-sm text-[var(--muted)] max-w-xl">
            Your bookmarks, collections, and private reflections — all in one place.
          </p>
        </section>

        {/* Tabs */}
        <section className="glass-card p-4 sm:p-5 space-y-5">

          <div className="flex flex-wrap gap-2 sm:gap-3">
            {([
              { key: "bookmarks", label: "Bookmarks" },
              { key: "collections", label: "Collections" },
              { key: "notes", label: "Notes" },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all ${
                  activeTab === tab.key
                    ? "border-[var(--gold-border)] bg-[var(--gold-dim)] text-[var(--gold)]"
                    : "border-white/10 bg-white/4 text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                {tab.label}
                <span className="text-xs opacity-70">
                  {tabCounts[tab.key]}
                </span>
              </button>
            ))}
          </div>

          {/* BOOKMARKS */}
          {activeTab === "bookmarks" && (
            <div className="space-y-4">
              {loading
                ? renderSkeleton()
                : bookmarks.length === 0
                  ? renderEmpty("No bookmarks yet", "Save ayahs you want to revisit.")
                  : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {bookmarks.map((bookmark) => (
                        <div
                          key={bookmark.id}
                          className="rounded-2xl border border-white/8 bg-white/4 p-4 hover:border-[var(--gold-border)] transition"
                        >
                          <p className="font-mono text-sm text-[var(--gold)]">
                            {bookmark.verse_key}
                          </p>
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            Saved {new Date(bookmark.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
            </div>
          )}

          {/* COLLECTIONS */}
          {activeTab === "collections" && (
            <div className="space-y-4">
              {loading
                ? renderSkeleton()
                : collections.length === 0
                  ? renderEmpty("No collections yet", "Group ayahs into meaningful sets.")
                  : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {collections.map((collection) => (
                        <div
                          key={collection.id}
                          className="rounded-2xl border border-white/8 bg-white/4 p-4 hover:border-[var(--gold-border)] transition"
                        >
                          <p className="text-sm font-medium">
                            {collection.name}
                          </p>
                          <p className="text-xs text-[var(--muted)] mt-1">
                            {collection.verse_count} ayahs
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
            </div>
          )}

          {/* NOTES */}
          {activeTab === "notes" && (
            <div className="space-y-4">
              {loading
                ? renderSkeleton()
                : notes.length === 0
                  ? renderEmpty("No notes yet", "Keep your private reflections here.")
                  : (
                    <div className="space-y-3">
                      {notes.map((note) => (
                        <div
                          key={note.id}
                          className="rounded-2xl border border-white/8 bg-white/4 p-4 hover:border-[var(--gold-border)] transition"
                        >
                          <p className="font-mono text-xs text-[var(--gold)]">
                            {note.verse_key}
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-[var(--text-soft)]">
                            {note.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
