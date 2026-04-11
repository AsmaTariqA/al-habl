"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { getClientAccessToken } from "@/lib/client-access"
import {
  createComment,
  createPost,
  getComments,
  getRoom,
  getRoomMembers,
  getRoomPosts,
  getUserProfile,
  likePost as likePostRequest,
} from "@/lib/qf-api"
import { getStudyDateKey, getTodayVerseKey, type Lens } from "@/lib/circle-constants"
import { session } from "@/lib/session"
import type { Comment, Post, Room, RoomMember, UserProfile } from "@/types/circle"

type CommentMap = Record<string, Comment[]>
type LoadingMap = Record<string, boolean>

function sortPosts(posts: Post[]) {
  return [...posts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

function isTodaysPost(post: Post) {
  return post.created_at.slice(0, 10) === getStudyDateKey()
}

export function useCircle(initialRoomId?: string | null) {
  const [room, setRoom] = useState<Room | null>(null)
  const [members, setMembers] = useState<RoomMember[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [commentsByPost, setCommentsByPost] = useState<CommentMap>({})
  const [loadingComments, setLoadingComments] = useState<LoadingMap>({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const roomIdRef = useRef<string | null>(initialRoomId ?? null)
  const accessTokenRef = useRef<string | null>(null)

  const userId = useMemo(() => session.getUserId(), [])

 const ensureAccessToken = useCallback(async (): Promise<string | null> => {
  // ✅ CORRECT — no hooks inside here, just logic
  const userId = localStorage.getItem('qf_user_id')
  if (!userId) return null

  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })

  if (!res.ok) return null
  const { accessToken } = await res.json()
  return accessToken
}, [])

  const refreshPosts = useCallback(async () => {
    const token = await ensureAccessToken()
    const roomId = roomIdRef.current
    if (!token || !roomId) return

    const postData = await getRoomPosts(token, roomId)
    if (!postData) return

    setPosts(sortPosts(postData.filter(isTodaysPost)))
  }, [ensureAccessToken])

  const fetchRoom = useCallback(
    async (roomId: string) => {
      setLoading(true)
      setError(null)
      roomIdRef.current = roomId
      session.setRoomId(roomId)

      const token = await ensureAccessToken()
      if (!token) {
        setLoading(false)
        return
      }

      const [roomData, memberData, postData, profileData] = await Promise.all([
        getRoom(token, roomId),
        getRoomMembers(token, roomId),
        getRoomPosts(token, roomId),
        getUserProfile(token),
      ])

      if (!roomData) {
        setError("We couldn't load your circle.")
        setLoading(false)
        return
      }

      setRoom(roomData)
      setMembers(memberData ?? [])
      setPosts(sortPosts((postData ?? []).filter(isTodaysPost)))
      setProfile(profileData)
      setLoading(false)
    },
    [ensureAccessToken],
  )

  const postReflection = useCallback(
    async (body: string, lens: Lens) => {
      const token = await ensureAccessToken()
      const roomId = roomIdRef.current
      if (!token || !roomId || !userId) return null

      setSubmitting(true)
      setError(null)

      const member = members.find((entry) => entry.user_id === userId)
      const optimisticPost: Post = {
        id: `temp-${Date.now()}`,
        room_id: roomId,
        user_id: userId,
        username: member?.username ?? profile?.username ?? "You",
        avatar: member?.avatar ?? profile?.avatar,
        body,
        tags: [lens, getTodayVerseKey()],
        lens,
        verse_key: getTodayVerseKey(),
        created_at: new Date().toISOString(),
        like_count: 0,
        comment_count: 0,
        liked_by_me: false,
      }

      setPosts((current) => sortPosts([optimisticPost, ...current]))

      const created = await createPost(token, body, Number(roomId), optimisticPost.verse_key ?? getTodayVerseKey(), lens)
      if (!created) {
        setPosts((current) => current.filter((post) => post.id !== optimisticPost.id))
        setError("Your reflection couldn't be posted.")
        setSubmitting(false)
        return null
      }

      setPosts((current) =>
        sortPosts(current.map((post) => (post.id === optimisticPost.id ? created : post))),
      )
      setSubmitting(false)
      return created
    },
    [ensureAccessToken, members, profile, userId],
  )

  const likePost = useCallback(
    async (postId: string) => {
      const token = await ensureAccessToken()
      if (!token) return false

      const currentPost = posts.find((post) => post.id === postId)
      if (!currentPost) return false

      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                liked_by_me: !post.liked_by_me,
                like_count: Math.max(post.like_count + (post.liked_by_me ? -1 : 1), 0),
              }
            : post,
        ),
      )

      const liked = await likePostRequest(token, postId)
      if (!liked) {
        setPosts((current) =>
          current.map((post) => (post.id === postId ? currentPost : post)),
        )
      }

      return liked
    },
    [ensureAccessToken, posts],
  )

  const loadComments = useCallback(
    async (postId: string) => {
      if (commentsByPost[postId]) return commentsByPost[postId]

      const token = await ensureAccessToken()
      if (!token) return null

      setLoadingComments((current) => ({ ...current, [postId]: true }))
      const comments = await getComments(token, postId)
      setLoadingComments((current) => ({ ...current, [postId]: false }))

      if (!comments) return null

      setCommentsByPost((current) => ({ ...current, [postId]: comments }))
      return comments
    },
    [commentsByPost, ensureAccessToken],
  )

  const addComment = useCallback(
    async (postId: string, body: string) => {
      const token = await ensureAccessToken()
      if (!token || !userId) return null

      const optimisticComment: Comment = {
        id: `temp-comment-${Date.now()}`,
        post_id: postId,
        user_id: userId,
        username: profile?.username ?? "You",
        body,
        created_at: new Date().toISOString(),
      }

      setCommentsByPost((current) => ({
        ...current,
        [postId]: [...(current[postId] ?? []), optimisticComment],
      }))
      setPosts((current) =>
        current.map((post) =>
          post.id === postId ? { ...post, comment_count: post.comment_count + 1 } : post,
        ),
      )

      const created = await createComment(token, postId, body)
      if (!created) {
        setCommentsByPost((current) => ({
          ...current,
          [postId]: (current[postId] ?? []).filter((comment) => comment.id !== optimisticComment.id),
        }))
        setPosts((current) =>
          current.map((post) =>
            post.id === postId
              ? { ...post, comment_count: Math.max(post.comment_count - 1, 0) }
              : post,
          ),
        )
        return null
      }

      setCommentsByPost((current) => ({
        ...current,
        [postId]: (current[postId] ?? []).map((comment) =>
          comment.id === optimisticComment.id ? created : comment,
        ),
      }))

      return created
    },
    [ensureAccessToken, profile?.username, userId],
  )

  useEffect(() => {
    const targetRoomId = initialRoomId ?? session.getRoomId()
    if (!targetRoomId) return

    const timeoutId = window.setTimeout(() => {
      void fetchRoom(targetRoomId)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [fetchRoom, initialRoomId])

  useEffect(() => {
    if (!roomIdRef.current) return

    const intervalId = window.setInterval(() => {
      void refreshPosts()
    }, 30_000)

    return () => window.clearInterval(intervalId)
  }, [refreshPosts])

  return {
    room,
    members,
    posts,
    commentsByPost,
    loadingComments,
    loading,
    submitting,
    error,
    profile,
    fetchRoom,
    postReflection,
    refreshPosts,
    likePost,
    loadComments,
    addComment,
  }
}
