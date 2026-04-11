"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { getClientAccessToken } from "@/lib/client-access"
import { createPost, getRoomPosts } from "@/lib/qf-api"
import { getTodayVerseKey } from "@/lib/circle-constants"
import type { Post } from "@/types/circle"

function sortMessages(items: Post[]) {
  return [...items].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

export function useChat(roomId?: string | null) {
  const [messages, setMessages] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const roomIdRef = useRef<string | null>(roomId ?? null)

  const refreshMessages = useCallback(async () => {
    const token = await getClientAccessToken()
    const currentRoom = roomIdRef.current
    if (!token || !currentRoom) return

    const data = await getRoomPosts(token, currentRoom)
    setMessages(sortMessages(data ?? []))
    setLoading(false)
  }, [])

  const sendMessage = useCallback(async (body: string) => {
    const token = await getClientAccessToken()
    const currentRoom = roomIdRef.current
    if (!token || !currentRoom) return null

    setSending(true)
    setError(null)

    const verseKey = getTodayVerseKey()
    const created = await createPost(token, body, Number(currentRoom), verseKey, "relevance")
    if (!created) {
      setError("We couldn't send this message.")
      setSending(false)
      return null
    }

    setMessages((current) => sortMessages([...current, created]))
    setSending(false)
    return created
  }, [])

  useEffect(() => {
    roomIdRef.current = roomId ?? null
    if (!roomId) return

    const timeoutId = window.setTimeout(() => {
      void refreshMessages()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [roomId, refreshMessages])

  useEffect(() => {
    if (!roomIdRef.current) return

    const intervalId = window.setInterval(() => {
      void refreshMessages()
    }, 20_000)

    return () => window.clearInterval(intervalId)
  }, [refreshMessages])

  return { messages, sendMessage, sending, loading, error }
}
