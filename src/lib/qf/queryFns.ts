import { getClientAccessToken } from "@/lib/client-access"
import {
  getActivityDays,
  getBookmarks,
  getCollections,
  getGoals,
  getNotes,
  getRoom,
  getRoomMembers,
  getRoomPosts,
  getStreaks,
  getUserProfile,
  getUserRooms,
} from "@/lib/qf-api"
import { session } from "@/lib/session"
import type { Post } from "@/types/circle"

export async function qfProfileQueryFn() {
  const token = await getClientAccessToken()
  if (!token) return null
  return getUserProfile(token).catch(() => null)
}

export async function qfStreaksQueryFn() {
  const token = await getClientAccessToken()
  if (!token) return null
  return getStreaks(token).catch(() => null)
}

export async function qfRoomQueryFn(roomId: string) {
  const token = await getClientAccessToken()
  if (!token) return null
  return getRoom(token, roomId).catch(() => null)
}

export async function qfMembersQueryFn(roomId: string) {
  const token = await getClientAccessToken()
  if (!token) return []
  return getRoomMembers(token, roomId).catch(() => [])
}

export async function qfPostsQueryFn(roomId: string) {
  const token = await getClientAccessToken()
  if (!token) return []
  try {
    const data = await getRoomPosts(token, roomId)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export type ProfileExtrasResult = {
  activityDays: Awaited<ReturnType<typeof getActivityDays>>
  goals: Awaited<ReturnType<typeof getGoals>>
  bookmarks: Awaited<ReturnType<typeof getBookmarks>>
  collections: Awaited<ReturnType<typeof getCollections>>
  notes: Awaited<ReturnType<typeof getNotes>>
  rooms: Awaited<ReturnType<typeof getUserRooms>>
  totalReflections: number
  monthlyReflections: number
}

export async function qfProfileExtrasQueryFn(): Promise<ProfileExtrasResult | null> {
  const token = await getClientAccessToken()
  if (!token) return null

  const [activityData, goalsData, bookmarks, collections, notes, rooms] =
    await Promise.all([
      getActivityDays(token).catch(() => null),
      getGoals(token).catch(() => null),
      getBookmarks(token).catch(() => null),
      getCollections(token).catch(() => null),
      getNotes(token).catch(() => null),
      getUserRooms(token, 100).catch(() => null),
    ])

  const currentMonthKey = new Date().toISOString().slice(0, 7)
  const userId = session.getUserId()
  const roomPosts = await Promise.all(
    (rooms ?? []).map((room) =>
      getRoomPosts(token, room.id).catch(() => [] as Post[]),
    ),
  )
  const reflectionPosts = roomPosts
    .flatMap((items) => items ?? [])
    .filter(
      (post) => post.user_id === userId,
    )

  const monthlyReflections = reflectionPosts.filter((post) =>
    post.created_at.startsWith(currentMonthKey),
  ).length

  return {
    activityDays: activityData ?? [],
    goals: goalsData ?? [],
    bookmarks: bookmarks ?? [],
    collections: collections ?? [],
    notes: notes ?? [],
    rooms: rooms ?? [],
    totalReflections: reflectionPosts.length,
    monthlyReflections,
  }
}
