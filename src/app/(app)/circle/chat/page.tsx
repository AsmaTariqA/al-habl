"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { BottomNavigation } from "@/components/circle/BottomNavigation"
import { SidebarNav } from "@/components/circle/SidebarNav"
import { useChat } from "@/hooks/useChat"
import { session } from "@/lib/session"

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

function formatTime(iso: string) {
  const date = new Date(iso)
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export default function ChatPage() {
  const [roomId, setRoomId] = useState<string | null>(() => session.getRoomId())
  const [draft, setDraft] = useState("")
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const { messages, sendMessage, sending, loading, error } = useChat(roomId)
  const userId = useMemo(() => session.getUserId(), [])

  useEffect(() => {
    if (roomId) return

    const restoreRoom = async () => {
      const response = await fetch('/api/circle')
      const data = await response.json()
      if (data.room?.id) {
        session.setRoomId(data.room.id)
        setRoomId(data.room.id)
      }
    }

    void restoreRoom()
  }, [roomId])

  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages.length])

  async function handleSend() {
    if (draft.trim().length < 2 || sending) return
    const body = draft.trim()
    setDraft("")
    await sendMessage(body)
  }

  return (
    <div className="min-h-screen bg-[var(--ink)] text-[var(--text)]">
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-60 flex-col border-r border-white/6 bg-[rgba(15,14,12,0.8)] backdrop-blur-xl z-30 p-4">
        <div className="mb-8 px-2">
          <p className="text-sm font-bold tracking-[0.2em] text-[var(--gold)] uppercase">Al-Habl</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">Circle Chat</p>
        </div>
        <SidebarNav />
      </aside>

      <div className="lg:ml-60">
        <header className="sticky top-0 z-20 border-b border-white/6 bg-[rgba(15,14,12,0.85)] backdrop-blur-xl">
          <div className="mx-auto w-full max-w-[1200px] px-4 py-3">
            <p className="text-xs font-semibold tracking-widest uppercase text-[var(--muted)]">Circle Chat</p>
            <h1 className="text-lg font-semibold">Reflect together in real time</h1>
          </div>
        </header>

        <main className="mx-auto flex min-h-[calc(100vh-180px)] w-full max-w-[1200px] flex-col px-4 pb-40 pt-4 lg:pb-24">
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-white/8 bg-white/3 p-4"
          >
            {loading ? (
              <div className="space-y-3">
                <div className="skeleton h-16 rounded-2xl" />
                <div className="skeleton h-16 rounded-2xl" />
                <div className="skeleton h-16 rounded-2xl" />
              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-dim)] p-8 text-center">
                <p className="text-base font-medium text-[var(--gold)]">No messages yet</p>
                <p className="mt-1 text-sm text-[var(--muted)]">Start the conversation for today&apos;s ayah.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const mine = msg.user_id === userId
                return (
                  <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl border px-4 py-3 ${mine ? "border-[var(--gold-border)] bg-[var(--gold)] text-[var(--ink)]" : "border-white/10 bg-white/4 text-[var(--text)]"}`}>
                      <div className={`flex items-center gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                        {!mine && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/6 text-xs text-[var(--muted)]">
                            {getInitials(msg.username)}
                          </div>
                        )}
                        <p className={`text-xs ${mine ? "text-[var(--ink)]" : "text-[var(--muted)]"}`}>
                          {mine ? "You" : msg.username} · {formatTime(msg.created_at)}
                        </p>
                      </div>
                      <p className={`mt-2 text-sm leading-6 ${mine ? "text-[var(--ink)]" : "text-[var(--text)]"}`}>
                        {msg.body}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {error && <p className="mt-2 text-xs text-red-300/80">{error}</p>}

          <div className="mt-4 rounded-2xl border border-white/8 bg-white/3 p-3 lg:static fixed inset-x-0 bottom-20 z-30 mx-auto w-full max-w-[1200px] bg-[rgba(15,14,12,0.92)] backdrop-blur-xl lg:bg-white/3">
            <textarea
              className="w-full rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-sm leading-7 placeholder:text-[var(--muted)] focus:border-white/20 focus:outline-none resize-none min-h-[90px]"
              placeholder="Share a quick reflection with your circle..."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-[var(--muted)]">{draft.length}/500</p>
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={sending || draft.trim().length < 2}
                className="rounded-xl bg-[var(--gold)] px-5 py-2 text-sm font-semibold text-[var(--ink)] disabled:opacity-40"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </main>
      </div>

      <div className="lg:hidden"><BottomNavigation /></div>
    </div>
  )
}
