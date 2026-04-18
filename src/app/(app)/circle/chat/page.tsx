"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "@/hooks/useChat"
import { LENS_LABELS, type Lens } from "@/lib/circle-constants"
import { session } from "@/lib/session"
import { AppShell } from "@/components/circle/AppShell"

function formatTime(iso: string) {
  const date = new Date(iso)
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export default function ChatPage() {
  const [roomId, setRoomId] = useState<string | null>(() => session.getRoomId())
  const [draft, setDraft] = useState("")
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const { messages, sendMessage, deleteMessage, sending, loading, error } =
    useChat(roomId)

  const userId = session.getUserId()

  useEffect(() => {
    if (roomId) return

    const restoreRoom = async () => {
      const response = await fetch("/api/circle")
      const data = await response.json()
      if (data.room?.id) {
        session.setRoomId(data.room.id)
        setRoomId(data.room.id)
      }
    }

    void restoreRoom()
  }, [roomId])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  async function handleSend() {
    if (draft.trim().length < 2 || sending) return
    const body = draft.trim()
    setDraft("")
    await sendMessage(body)
  }

  return (
    <>
   
    <AppShell pageLabel="Chat">
    <div className="min-h-screen bg-[var(--ink)] text-[var(--text)]">
      
      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-[var(--glass-border)] bg-[var(--surface)]/80 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-3">
          <p className="text-xs font-semibold tracking-widest uppercase text-[var(--muted)]">
            Circle Chat
          </p>
          <h1 className="text-lg font-semibold">
            Reflect together in real time
          </h1>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-180px)] w-full max-w-[1200px] flex-col px-4 pb-40 pt-4 lg:pb-24">
        
        {/* CHAT LIST */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-[var(--glass-border)] bg-[var(--glass)] p-4"
        >
          {loading ? (
            <div className="space-y-3">
              <div className="skeleton h-16 rounded-2xl" />
              <div className="skeleton h-16 rounded-2xl" />
              <div className="skeleton h-16 rounded-2xl" />
            </div>
          ) : messages.length === 0 ? (
            <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-dim)] p-8 text-center">
              <p className="text-base font-medium text-[var(--gold)]">
                No messages yet
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Start the conversation for today&apos;s ayah.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const mine = msg.user_id === userId

                return (
                  <div
                    key={msg.id}
                    className={`group flex ${
                      mine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`relative max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        mine
                          ? "bg-[var(--gold)] text-[var(--ink)]"
                          : "bg-[var(--glass-strong)] text-[var(--text)] border border-[var(--glass-border)]"
                      }`}
                    >
                      {/* DELETE BUTTON */}
                      {mine && (
                        <button
                          onClick={() => {
                            deleteMessage(msg.id)
                          }}
                          className="absolute -top-2 -right-2 hidden group-hover:flex items-center justify-center w-7 h-7 rounded-full bg-[var(--gold)] text-[var(--ink)] text-xs"
                        >
                          🗑
                        </button>
                      )}

                      {/* Username */}
                      {!mine && (
                        <p className="text-xs font-medium text-[var(--gold)] mb-1">
                          {msg.username}
                        </p>
                      )}

                      {/* Lens */}
                      {msg.lens && (
                        <span
                          className={`inline-block text-[10px] uppercase tracking-widest mb-1.5 px-2 py-0.5 rounded-full ${
                            mine
                              ? "bg-[var(--ink)]/15 text-[var(--ink)]"
                              : "bg-[var(--gold-dim)] text-[var(--gold)]"
                          }`}
                        >
                          {LENS_LABELS[msg.lens as Lens] ?? msg.lens}
                        </span>
                      )}

                      {/* Message */}
                      <p className="text-sm leading-6">{msg.body}</p>

                      {/* Time */}
                      <p
                        className={`text-[10px] mt-1 ${
                          mine
                            ? "text-[var(--ink)]/60"
                            : "text-[var(--muted)]"
                        }`}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

        {/* INPUT */}
        <div className="mt-4 rounded-2xl border border-[var(--glass-border)] bg-[var(--surface)] p-3 lg:static fixed inset-x-0 bottom-20 z-30 mx-auto w-full max-w-[1200px] backdrop-blur-xl">
          <textarea
            className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass)] px-4 py-3 text-sm leading-7 placeholder:text-[var(--muted)] focus:border-[var(--gold-border)] focus:outline-none resize-none min-h-[90px]"
            placeholder="Share a quick reflection..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-[var(--muted)]">{draft.length}/500</p>
            <button
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
    </AppShell>
 </>
  )
}