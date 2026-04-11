"use client"

import { useEffect, useMemo, useState } from "react"
import { BottomNavigation } from "@/components/circle/BottomNavigation"
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
    <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-dim)] p-8 text-center">
      <p className="text-base font-medium text-[var(--gold)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">{body}</p>
    </div>
  )

  const renderSkeleton = () => (
    <div className="space-y-3">
      <div className="skeleton h-16 rounded-2xl" />
      <div className="skeleton h-16 rounded-2xl" />
      <div className="skeleton h-16 rounded-2xl" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--ink)] pb-24 text-[var(--text)]">
      <main className="circle-shell space-y-4 pt-6">
        <section className="glass-card space-y-2 p-5">
          <p className="muted-kicker">Archive</p>
          <h1 className="text-3xl font-semibold">Saved for later return</h1>
          <p className="text-sm text-[var(--muted)]">Your bookmarks, collections, and private notes in one place.</p>
        </section>

        <section className="glass-card space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            {([
              { key: "bookmarks", label: "Bookmarks" },
              { key: "collections", label: "Collections" },
              { key: "notes", label: "Notes" },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-all ${
                  activeTab === tab.key
                    ? "border-[var(--gold-border)] bg-[var(--gold-dim)] text-[var(--gold)]"
                    : "border-white/10 bg-white/4 text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                {tab.label}
                <span className="ml-2 text-xs text-[var(--muted)]">{tabCounts[tab.key]}</span>
              </button>
            ))}
          </div>

          {activeTab === "bookmarks" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-lg font-medium">Bookmarks</p>
                <span className="text-sm text-[var(--gold)]">{bookmarks.length}</span>
              </div>
              {loading
                ? renderSkeleton()
                : bookmarks.length === 0
                  ? renderEmpty("No bookmarks yet", "Save ayahs that you want to return to.")
                  : (
                    <div className="space-y-2">
                      {bookmarks.map((bookmark) => (
                        <div key={bookmark.id} className="rounded-[18px] border border-white/8 bg-white/4 px-4 py-3">
                          <p className="font-mono text-sm text-[var(--gold)]">{bookmark.verse_key}</p>
                          <p className="text-xs text-[var(--muted)]">Saved {new Date(bookmark.created_at).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
            </div>
          )}

          {activeTab === "collections" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-lg font-medium">Collections</p>
                <span className="text-sm text-[var(--gold)]">{collections.length}</span>
              </div>
              {loading
                ? renderSkeleton()
                : collections.length === 0
                  ? renderEmpty("No collections yet", "Group ayahs into themed collections.")
                  : (
                    <div className="space-y-2">
                      {collections.map((collection) => (
                        <div key={collection.id} className="rounded-[18px] border border-white/8 bg-white/4 px-4 py-3">
                          <p className="text-sm">{collection.name}</p>
                          <p className="text-xs text-[var(--muted)]">{collection.verse_count} ayahs</p>
                        </div>
                      ))}
                    </div>
                  )}
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-lg font-medium">Notes</p>
                <span className="text-sm text-[var(--gold)]">{notes.length}</span>
              </div>
              {loading
                ? renderSkeleton()
                : notes.length === 0
                  ? renderEmpty("No notes yet", "Write reflections you want to keep private.")
                  : (
                    <div className="space-y-2">
                      {notes.map((note) => (
                        <div key={note.id} className="rounded-[18px] border border-white/8 bg-white/4 px-4 py-3">
                          <p className="font-mono text-xs text-[var(--gold)]">{note.verse_key}</p>
                          <p className="mt-2 text-sm text-[var(--text)]">{note.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
            </div>
          )}
        </section>
      </main>
      <BottomNavigation />
    </div>
  )
}
