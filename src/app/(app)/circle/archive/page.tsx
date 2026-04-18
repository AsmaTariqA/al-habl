"use client"

import { useEffect, useMemo, useState } from "react"
import { AppShell } from "@/components/circle/AppShell"
import { getClientAccessToken } from "@/lib/client-access"
import { getBookmarks, getCollections, getNotes } from "@/lib/qf-api"
import type { Bookmark, Note, VerseCollection } from "@/types/circle"

type TabKey = "bookmarks" | "collections" | "notes"

const TAB_ICONS: Record<TabKey, React.ReactNode> = {
  bookmarks: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 4h10v16l-5-4-5 4V4Z"/>
    </svg>
  ),
  collections: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="5" width="6" height="6" rx="1.5"/><rect x="14" y="5" width="6" height="6" rx="1.5"/>
      <rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>
    </svg>
  ),
  notes: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 4h10a2 2 0 0 1 2 2v12l-4-3H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/>
    </svg>
  ),
}

export default function ArchivePage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [collections, setCollections] = useState<VerseCollection[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>("bookmarks")

  useEffect(() => {
    const loadArchive = async () => {
      const token = await getClientAccessToken()
      if (!token) { setLoading(false); return }
      const [bookmarkData, collectionData, noteData] = await Promise.all([
        getBookmarks(token), getCollections(token), getNotes(token),
      ])
      setBookmarks(bookmarkData ?? [])
      setCollections(collectionData ?? [])
      setNotes(noteData ?? [])
      setLoading(false)
    }
    void loadArchive()
  }, [])

  const tabCounts = useMemo(() => ({
    bookmarks: bookmarks.length, collections: collections.length, notes: notes.length,
  }), [bookmarks.length, collections.length, notes.length])

  const cardStyle: React.CSSProperties = { background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '1rem', transition: 'border-color 0.15s ease' }

  const renderEmpty = (title: string, body: string) => (
    <div style={{ padding: '3rem 2rem', textAlign: 'center', background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', borderRadius: 'var(--radius-lg)' }}>
      <p style={{ fontWeight: 600, color: 'var(--gold)', marginBottom: '0.4rem' }}>{title}</p>
      <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>{body}</p>
    </div>
  )

  const renderSkeleton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius-md)' }} />)}
    </div>
  )

  return (
    <AppShell pageLabel="Archive">
      <main style={{ margin: '0 auto', width: '100%', maxWidth: '64rem', padding: '2rem 1rem 6rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        <section className="glass-card" style={{ padding: '1.75rem 2rem' }}>
          <span className="muted-kicker" style={{ display: 'flex', marginBottom: '0.75rem' }}>Archive</span>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.04em', marginBottom: '0.5rem' }}>Saved for later return</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.7, maxWidth: '44ch' }}>Your bookmarks, collections, and private reflections — all in one place.</p>
        </section>

        <section className="glass-card" style={{ padding: '1.5rem' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {(['bookmarks', 'collections', 'notes'] as const).map((tab) => {
              const active = activeTab === tab
              return (
                <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.9rem', borderRadius: '99px', border: `1px solid ${active ? 'var(--gold-border)' : 'var(--glass-border)'}`, background: active ? 'var(--gold-dim)' : 'var(--glass-strong)', color: active ? 'var(--gold)' : 'var(--muted)', fontSize: '0.8rem', fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s ease' }}>
                  {TAB_ICONS[tab]}
                  <span style={{ textTransform: 'capitalize' }}>{tab}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '18px', height: '18px', padding: '0 4px', borderRadius: '99px', background: active ? 'var(--gold-dim2)' : 'var(--glass)', border: `1px solid ${active ? 'var(--gold-border)' : 'var(--glass-border)'}`, fontSize: '0.68rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: active ? 'var(--gold)' : 'var(--muted)' }}>
                    {tabCounts[tab]}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="divider" style={{ marginBottom: '1.25rem' }} />

          {activeTab === "bookmarks" && (
            <div>{loading ? renderSkeleton() : bookmarks.length === 0 ? renderEmpty("No bookmarks yet", "Save ayahs you want to revisit.") : (
              <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                {bookmarks.map((bookmark) => (
                  <div key={bookmark.id} style={cardStyle} onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--gold-border)'} onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--glass-border)'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <span style={{ color: 'var(--gold)', opacity: 0.6, display: 'flex' }}>{TAB_ICONS.bookmarks}</span>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gold)' }}>{bookmark.verse_key}</p>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Saved {new Date(bookmark.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                ))}
              </div>
            )}</div>
          )}

          {activeTab === "collections" && (
            <div>{loading ? renderSkeleton() : collections.length === 0 ? renderEmpty("No collections yet", "Group ayahs into meaningful sets.") : (
              <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                {collections.map((collection) => (
                  <div key={collection.id} style={cardStyle} onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--gold-border)'} onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--glass-border)'}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: '0.3rem' }}>{collection.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{collection.verse_count} {collection.verse_count === 1 ? 'ayah' : 'ayahs'}</p>
                  </div>
                ))}
              </div>
            )}</div>
          )}

          {activeTab === "notes" && (
            <div>{loading ? renderSkeleton() : notes.length === 0 ? renderEmpty("No notes yet", "Keep your private reflections here.") : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {notes.map((note) => (
                  <div key={note.id} style={cardStyle} onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--gold-border)'} onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--glass-border)'}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--gold)', marginBottom: '0.6rem', letterSpacing: '0.06em' }}>{note.verse_key}</p>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--text-soft)' }}>{note.body}</p>
                  </div>
                ))}
              </div>
            )}</div>
          )}
        </section>
      </main>
    </AppShell>
  )
}