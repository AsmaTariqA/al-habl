"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { getClientAccessToken } from "@/lib/client-access"
import { getRoomMembers, getUserProfile } from "@/lib/qf-api"
import { session } from "@/lib/session"
import type { RoomMember, UserProfile } from "@/types/circle"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type ChatMessage = {
  id: string
  room_id: string
  user_id: string
  username: string
  body: string
  created_at: string
  lens?: string | null
  [key: string]: unknown
}

function shouldReplaceUsername(message: ChatMessage) {
  return !message.username || message.username === "You" || message.username === "Anonymous" || message.username === message.user_id
}

function resolveMessageAuthor(
  message: ChatMessage,
  roomMembers: RoomMember[],
  profile: UserProfile | null,
  currentUserId: string | null,
) {
  const member = roomMembers.find((entry) => entry.user_id === message.user_id)
  const isCurrentUser = Boolean(currentUserId && message.user_id === currentUserId)
  const resolvedUsername = member?.username ?? (isCurrentUser ? profile?.username : undefined)

  return {
    ...message,
    username: shouldReplaceUsername(message)
      ? resolvedUsername ?? message.username ?? "Member"
      : message.username,
  }
}

export function useChat(roomId?: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [members, setMembers] = useState<RoomMember[]>([])

  const roomRef = useRef(roomId)
  const profileRef = useRef<UserProfile | null>(null)
  const membersRef = useRef<RoomMember[]>([])
  const userId = useMemo(() => session.getUserId(), [])

  useEffect(() => {
    roomRef.current = roomId
  }, [roomId])

  useEffect(() => {
    profileRef.current = profile
  }, [profile])

  useEffect(() => {
    membersRef.current = members
  }, [members])

  const hydrateMessages = useCallback(
    (
      nextMessages: ChatMessage[],
      roomMembers: RoomMember[] = membersRef.current,
      currentProfile: UserProfile | null = profileRef.current,
    ) => {
      return nextMessages.map((message) =>
        resolveMessageAuthor(message, roomMembers, currentProfile, userId)
      )
    },
    [userId],
  )

  const loadIdentity = useCallback(async () => {
    const token = await getClientAccessToken().catch(() => null)
    if (!token) {
      return {
        currentProfile: profileRef.current,
        roomMembers: membersRef.current,
      }
    }

    const [currentProfile, roomMembers] = await Promise.all([
      getUserProfile(token).catch(() => null),
      roomRef.current
        ? getRoomMembers(token, roomRef.current).catch(() => [])
        : Promise.resolve(membersRef.current),
    ])

    if (currentProfile) {
      profileRef.current = currentProfile
      setProfile(currentProfile)
    }

    membersRef.current = roomMembers ?? []
    setMembers(roomMembers ?? [])
    setMessages((current) =>
      hydrateMessages(current, roomMembers ?? [], currentProfile ?? profileRef.current)
    )

    return {
      currentProfile: currentProfile ?? profileRef.current,
      roomMembers: roomMembers ?? membersRef.current,
    }
  }, [hydrateMessages])

  useEffect(() => {
    void loadIdentity()
  }, [loadIdentity, roomId])

  const fetchMessages = useCallback(async () => {
    if (!roomRef.current) return

    const { currentProfile, roomMembers } = await loadIdentity()

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("room_id", roomRef.current)
      .order("created_at", { ascending: true })

    if (error) {
      setError("Failed to load messages")
      setLoading(false)
      return
    }

    setMessages(
      hydrateMessages((data ?? []) as ChatMessage[], roomMembers, currentProfile)
    )
    setLoading(false)
  }, [hydrateMessages, loadIdentity])

  const sendMessage = useCallback(async (body: string) => {
    if (!roomRef.current) return
    if (body.trim().length < 2) return

    const currentUserId = userId ?? session.getUserId()
    if (!currentUserId) return

    let currentProfile = profile
    let roomMembers = members
    let member = roomMembers.find((entry) => entry.user_id === currentUserId)
    let username = member?.username ?? currentProfile?.username

    if (!username) {
      const identity = await loadIdentity()
      currentProfile = identity.currentProfile
      roomMembers = identity.roomMembers
      member = roomMembers.find((entry) => entry.user_id === currentUserId)
      username = member?.username ?? currentProfile?.username
    }

    const newMsg = {
      room_id: roomRef.current,
      user_id: currentUserId,
      username: username ?? "Anonymous",
      body: body.trim(),
    }

    setSending(true)
    setError(null)

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

    if (data) {
      const createdMessage = hydrateMessages(
        [data as ChatMessage],
        roomMembers,
        currentProfile,
      )[0]

      setMessages((prev) => [...prev, createdMessage])
    }

    setSending(false)
  }, [hydrateMessages, loadIdentity, members, profile, userId])

  useEffect(() => {
    if (!roomId) return

    void fetchMessages()

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
          const nextMessage = hydrateMessages([payload.new as ChatMessage])[0]
          setMessages((prev) => [...prev, nextMessage])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchMessages, hydrateMessages, roomId])

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

  return { messages, sendMessage, loading, sending, error, deleteMessage }
}
