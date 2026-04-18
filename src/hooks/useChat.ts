"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"
import { session } from "@/lib/session"
import {  getUserProfile } from "@/lib/qf-api"
import type {  UserProfile } from "@/types/circle"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function useChat(roomId?: string | null) {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

    const [profile, setProfile] = useState<UserProfile | null>(null)

  const roomRef = useRef(roomId)

  useEffect(() => {
    roomRef.current = roomId
  }, [roomId])

  // 🔹 Load messages
  const fetchMessages = useCallback(async () => {
    if (!roomRef.current) return

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("room_id", roomRef.current)
      .order("created_at", { ascending: true })

    if (!error) setMessages(data || [])
    setLoading(false)
  }, [])

  // 🔹 Send message
  const sendMessage = useCallback(async (body: string) => {
    if (!roomRef.current) return
    if (body.trim().length < 2) return

    const userId = session.getUserId()

    const newMsg = {
      room_id: roomRef.current,
      user_id: userId,
      username: "You",
      body: body.trim(),
    }

    setSending(true)

    const { data, error } = await supabase
      .from("messages")
      .insert([newMsg])
      .select()
      .single()

    if (error) {
      setError("Failed to send message")
      setSending(false)
      return
    }

    setMessages((prev) => [...prev, data])
    setSending(false)
  }, [])

  // 🔹 Realtime subscription
  useEffect(() => {
    if (!roomId) return

    fetchMessages()

    const channel = supabase
  .channel(`chat-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, fetchMessages])

  const deleteMessage = useCallback(async (id: string) => {
  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", id)

  if (error) {
    setError("Failed to delete message")
    return
  }

  setMessages((prev) => prev.filter((msg) => msg.id !== id))
}, [])

  return { messages, sendMessage, loading, sending, error , deleteMessage}
}