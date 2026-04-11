import type {
  ActivityDay,
  AudioRecitation,
  Bookmark,
  Chapter,
  Comment,
  Goal,
  Note,
  Post,
  Room,
  RoomMember,
  Tafsir,
  Translation,
  UserProfile,
  UserStreak,
  Verse,
  VerseCollection,
  Word,
} from "@/types/circle"
import type { Surah as LegacySurah } from "@/types/quran"
import { LENSES } from "@/lib/circle-constants"
import { publicConfig } from "@/lib/config"

const CONTENT_BASE = `${publicConfig.QF_API_URL}/content/api/v4`
// CORRECT
const USER_BASE = `${publicConfig.QF_API_URL}/quran-reflect/v1`
const CLIENT_ID = publicConfig.QF_CLIENT_ID

export interface QfApiError {
  status: number
  statusText: string
  message: string
  type?: string
  details?: string
}

interface QfFetchResult<T> {
  data: T | null
  error: QfApiError | null
}

function getAuthHeaders(accessToken?: string) {
  return {
    "Content-Type": "application/json",
    "Accept": "application/json", // ✅ REQUIRED FIX
    "x-client-id": CLIENT_ID,
    ...(accessToken ? { "x-auth-token": accessToken } : {}),
  }
}
function normalizeApiError(status: number, statusText: string, rawBody: string): QfApiError {
  let parsed: Record<string, unknown> | null = null

  if (rawBody) {
    try {
      parsed = JSON.parse(rawBody) as Record<string, unknown>
    } catch {
      parsed = null
    }
  }

  return {
    status,
    statusText,
    message: readString(parsed?.message, statusText || "QF API request failed"),
    type: readString(parsed?.type) || undefined,
    details: readString(parsed?.details) || undefined,
  }
}

async function safeFetchResult<T>(
  path: string,
  init?: RequestInit,
  accessToken?: string,
  includeAuth = true,
  baseUrl = USER_BASE,
): Promise<QfFetchResult<T>> {
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        ...getAuthHeaders(includeAuth ? accessToken : undefined),
        ...(init?.headers ?? {}),
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      const error = normalizeApiError(response.status, response.statusText, errorText)
      console.error(
        `QF API request failed for ${path}: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`,
      )
      return { data: null, error }
    }

    return {
      data: (await response.json()) as T,
      error: null,
    }
  } catch (error) {
    console.error(`QF API request failed for ${path}:`, error)
    return {
      data: null,
      error: {
        status: 0,
        statusText: "Network Error",
        message: "The request could not be completed.",
      },
    }
  }
}

async function safeFetch<T>(
  path: string,
  init?: RequestInit,
  accessToken?: string,
  includeAuth = true,
  baseUrl = USER_BASE,
) {
  const result = await safeFetchResult<T>(path, init, accessToken, includeAuth, baseUrl)
  return result.data
}

async function safeFetchFromCandidates<T>(
  paths: string[],
  init?: RequestInit,
  accessToken?: string,
  includeAuth = true,
  baseUrl = USER_BASE,
): Promise<QfFetchResult<T>> {
  let lastError: QfApiError | null = null

  for (const path of paths) {
    const result = await safeFetchResult<T>(path, init, accessToken, includeAuth, baseUrl)
    if (result.data) {
      return result
    }

    lastError = result.error
    if (result.error && result.error.status !== 404) {
      return result
    }
  }

  return {
    data: null,
    error: lastError,
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function readNumber(value: unknown, fallback = 0) {
  return typeof value === "number" ? value : fallback
}

function readBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback
}

function pickPayload(source: unknown, keys: string[]) {
  const record = asRecord(source)
  if (!record) return null

  for (const key of keys) {
    if (key in record) {
      return record[key]
    }
  }

  return source
}

function normalizeTranslations(value: unknown): Translation[] {
  return asArray(value).map((entry) => {
    const record = asRecord(entry)
    const resource = asRecord(record?.resource_name) ?? asRecord(record?.resource)
    return {
      id: readNumber(record?.id),
      text: readString(record?.text),
      resource_name:
        readString(record?.resource_name) ||
        readString(resource?.name) ||
        readString(record?.name),
    }
  })
}

function normalizeWords(value: unknown): Word[] {
  return asArray(value).map((entry, index) => {
    const record = asRecord(entry)
    const translation = asRecord(record?.translation)
    const transliteration = asRecord(record?.transliteration)
    return {
      position: readNumber(record?.position, index + 1),
      text_uthmani: readString(record?.text_uthmani) || readString(record?.text),
      translation: {
        text: readString(translation?.text) || readString(record?.translation),
      },
      transliteration: {
        text: readString(transliteration?.text) || readString(record?.transliteration),
      },
    }
  })
}

function normalizeVerse(source: unknown): Verse | null {
  const record = asRecord(pickPayload(source, ["verse", "data"]))
  if (!record) return null

  return {
    verse_key: readString(record.verse_key),
    verse_number: readNumber(record.verse_number),
    text_uthmani: readString(record.text_uthmani),
    translations: normalizeTranslations(record.translations),
    words: normalizeWords(record.words),
    audio: readString(record.audio),
  }
}

function normalizeTafsir(source: unknown): Tafsir | null {
  const record = asRecord(pickPayload(source, ["tafsir", "data"]))
  if (!record) return null

  return {
    verse_key: readString(record.verse_key),
    text: readString(record.text),
    resource_name:
      readString(record.resource_name) ||
      readString(asRecord(record.resource_name)?.name) ||
      "Ibn Kathir",
  }
}

function normalizeChapter(source: unknown): Chapter | null {
  const record = asRecord(pickPayload(source, ["chapter", "data"]))
  if (!record) return null

  return {
    id: readNumber(record.id),
    name_simple: readString(record.name_simple) || readString(record.name),
    name_arabic: readString(record.name_arabic),
    translated_name: asRecord(record.translated_name) as Chapter["translated_name"],
    verses_count: readNumber(record.verses_count),
  }
}

function normalizeAudio(source: unknown, verseKey: string): AudioRecitation | null {
  const payload = pickPayload(source, ["audio_file", "audio", "recitation", "data"])
  const record = asRecord(payload)
  const files = asArray(asRecord(source)?.audio_files ?? asRecord(source)?.recitation_files)
  const fileRecord = record ?? asRecord(files[0])

  if (!fileRecord) return null

  return {
    verse_key: verseKey,
    url: readString(fileRecord.url),
    duration: readNumber(fileRecord.duration, undefined as never),
  }
}

function normalizeRoom(source: unknown): Room | null {
  const record = asRecord(pickPayload(source, ["room", "data"]))
  if (!record) return null

  return {
    id: readString(record.id) || String(readNumber(record.id)),
    name: readString(record.name),
    description: readString(record.description) || undefined,
    member_count: readNumber(record.member_count) || readNumber(record.membersCount),
    created_by: readString(record.created_by),
    created_at: readString(record.created_at),
    invite_code:
      readString(record.invite_code) ||
      readString(record.inviteCode) ||
      readString(record.url) ||
      readString(record.subdomain) ||
      undefined,
  }
}

function normalizeRoomArray(source: unknown): Room[] {
  const payload = pickPayload(source, ["rooms", "data"])
  return asArray(payload)
    .map((entry) => normalizeRoom(entry))
    .filter((entry): entry is Room => Boolean(entry))
}

function normalizeMember(source: unknown): RoomMember | null {
  const record = asRecord(source)
  if (!record) return null

  return {
    user_id: readString(record.user_id) || String(readNumber(record.id)),
    username: readString(record.username) || readString(record.name),
    avatar:
      readString(record.avatar) ||
      readString(asRecord(record.avatarUrl)?.small) ||
      readString(asRecord(record.avatarUrl)?.medium) ||
      undefined,
    joined_at: readString(record.joined_at),
    has_reflected_today: readBoolean(record.has_reflected_today),
  }
}

function normalizeMembers(source: unknown): RoomMember[] {
  const payload = pickPayload(source, ["members", "data"])
  return asArray(payload)
    .map((entry) => normalizeMember(entry))
    .filter((entry): entry is RoomMember => Boolean(entry))
}

function normalizeComment(source: unknown): Comment | null {
  const record = asRecord(source)
  if (!record) return null

  return {
    id: readString(record.id),
    post_id: readString(record.post_id),
    user_id: readString(record.user_id),
    username: readString(record.username) || readString(record.name),
    body: readString(record.body),
    created_at: readString(record.created_at),
  }
}

function normalizeComments(source: unknown): Comment[] {
  const payload = pickPayload(source, ["comments", "data"])
  return asArray(payload)
    .map((entry) => normalizeComment(entry))
    .filter((entry): entry is Comment => Boolean(entry))
}

function getLensFromTags(tags: string[]) {
  return tags.find((tag) => LENSES.includes(tag as (typeof LENSES)[number])) ?? "relevance"
}

function normalizePost(source: unknown): Post | null {
  const record = asRecord(source)
  if (!record) return null

  const tags = asArray(record.tags).map((tag) => readString(tag)).filter(Boolean)
  const references = asArray(record.references)
  const firstReference = asRecord(references[0])
  const chapterId = readNumber(firstReference?.chapterId)
  const verseFrom = readNumber(firstReference?.from)
  const verseKeyTag = tags.find((tag) => /^\d+:\d+$/.test(tag)) || (chapterId && verseFrom ? `${chapterId}:${verseFrom}` : undefined)

  return {
    id: readString(record.id) || String(readNumber(record.id)),
    room_id: readString(record.room_id) || String(readNumber(record.roomId)),
    user_id: readString(record.user_id) || String(readNumber(record.userId)),
    username: readString(record.username) || readString(record.name),
    avatar: readString(record.avatar) || undefined,
    body: readString(record.body),
    tags,
    lens: getLensFromTags(tags),
    verse_key: verseKeyTag,
    created_at: readString(record.created_at),
    like_count: readNumber(record.like_count) || readNumber(record.likesCount),
    comment_count: readNumber(record.comment_count) || readNumber(record.commentsCount),
    liked_by_me: readBoolean(record.liked_by_me) || readBoolean(record.likedByMe),
  }
}

function normalizePosts(source: unknown): Post[] {
  const payload = pickPayload(source, ["posts", "data"])
  return asArray(payload)
    .map((entry) => normalizePost(entry))
    .filter((entry): entry is Post => Boolean(entry))
}

function normalizeBookmarks(source: unknown): Bookmark[] {
  const payload = pickPayload(source, ["bookmarks", "data"])
  return asArray(payload).map((entry) => {
    const record = asRecord(entry)
    return {
      id: readString(record?.id),
      verse_key: readString(record?.verse_key),
      created_at: readString(record?.created_at),
    }
  })
}

function normalizeCollections(source: unknown): VerseCollection[] {
  const payload = pickPayload(source, ["collections", "data"])
  return asArray(payload).map((entry) => {
    const record = asRecord(entry)
    return {
      id: readString(record?.id),
      name: readString(record?.name),
      verse_count: readNumber(record?.verse_count),
      created_at: readString(record?.created_at),
    }
  })
}

function normalizeNotes(source: unknown): Note[] {
  const payload = pickPayload(source, ["notes", "data"])
  return asArray(payload).map((entry) => {
    const record = asRecord(entry)
    return {
      id: readString(record?.id),
      verse_key: readString(record?.verse_key),
      body: readString(record?.body),
      created_at: readString(record?.created_at),
    }
  })
}

function normalizeProfile(source: unknown): UserProfile | null {
  const record = asRecord(pickPayload(source, ["user", "profile", "data"]))
  if (!record) return null

  return {
    user_id: readString(record.user_id) || readString(record.id) || String(readNumber(record.id)),
    username: readString(record.username) || readString(record.name),
    avatar:
      readString(record.avatar) ||
      readString(asRecord(record.avatarUrl)?.small) ||
      readString(asRecord(record.avatarUrl)?.medium) ||
      undefined,
    quran_account_tag: readString(record.quran_account_tag) || readString(record.email) || undefined,
  }
}

function normalizeStreak(source: unknown): UserStreak | null {
  const record = asRecord(pickPayload(source, ["streak", "data"]))
  if (!record) return null

  return {
    current_streak: readNumber(record.current_streak),
    max_streak: readNumber(record.max_streak),
    last_activity: readString(record.last_activity),
  }
}

function normalizeActivityDays(source: unknown): ActivityDay[] {
  const payload = pickPayload(source, ["activity_days", "days", "data"])
  return asArray(payload).map((entry) => {
    const record = asRecord(entry)
    return {
      date: readString(record?.date),
      active: readBoolean(record?.active, true),
    }
  })
}

function normalizeGoals(source: unknown): Goal[] {
  const payload = pickPayload(source, ["goals", "data"])
  return asArray(payload).map((entry) => {
    const record = asRecord(entry)
    return {
      id: readString(record?.id),
      type: readString(record?.type),
      target: readNumber(record?.target),
      progress: readNumber(record?.progress),
      created_at: readString(record?.created_at),
    }
  })
}

export function generateRoomUrl(name: string) {
  return `${name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)}-${Date.now().toString(36)}`
}

export async function createRoomResult(
  accessToken: string,
  name: string,
  description = "",
  url = generateRoomUrl(name),
  isPublic = false,
) {
  const result = await safeFetchResult<unknown>(
    "/rooms/groups",
    {
      method: "POST",
      body: JSON.stringify({
        name,
        description,
        url,
        public: isPublic,
      }),
    },
    accessToken,
  )

  return {
    room: normalizeRoom(result.data),
    error: result.error,
  }
}
export async function createRoom(
  accessToken: string,
  name: string,
  description = "",
  url = generateRoomUrl(name),
  isPublic = false,
) {
  const result = await createRoomResult(accessToken, name, description, url, isPublic)
  return result.room
}

export async function getRoom(accessToken: string, roomId: string) {
  const data = await safeFetch<unknown>(
    `/rooms/${roomId}`,
    undefined,
    accessToken,
  )
  return normalizeRoom(data)
}

export async function getRoomMembers(accessToken: string, roomId: string) {
  const data = await safeFetch<unknown>(
    `/rooms/${roomId}/members`,
    undefined,
    accessToken,
  )
  return normalizeMembers(data)
}

export async function joinRoom(accessToken: string, roomId: string) {
  const data = await safeFetch<unknown>(
    `/rooms/groups/${roomId}/join`,
    { method: "POST" },
    accessToken,
  )

  return Boolean(data)
}

export async function acceptInviteByToken(accessToken: string, roomId: string, inviteToken: string) {
  const data = await safeFetch<unknown>(
    `/rooms/${roomId}/accept-invite?token=${encodeURIComponent(inviteToken)}`,
    { method: "POST" },
    accessToken,
  )

  return Boolean(data)
}

export async function leaveRoom(accessToken: string, roomId: string) {
  const data = await safeFetch<unknown>(
    `/rooms/groups/${roomId}/leave`,
    { method: "DELETE" },
    accessToken,
  )

  return Boolean(data)
}

export async function inviteToRoom(accessToken: string, roomId: string, userId: string) {
  const data = await safeFetch<unknown>(
    `/rooms/${roomId}/invite`,
    {
      method: "POST",
      body: JSON.stringify({ userId }),
    },
    accessToken,
  )

  return Boolean(data)
}

export async function getUserRooms(accessToken: string) {
  const data = await safeFetch<unknown>(
    "/rooms/joined-rooms?limit=5",
    undefined,
    accessToken,
  )
  return normalizeRoomArray(data)
}

export async function getUserRoomsResult(accessToken: string) {
  const result = await safeFetchResult<unknown>(
    "/rooms/joined-rooms?limit=5",
    undefined,
    accessToken,
  )

  return {
    rooms: normalizeRoomArray(result.data),
    error: result.error,
  }
}

export async function searchRooms(accessToken: string, query: string) {
  const data = await safeFetch<unknown>(
    `/rooms/search?query=${encodeURIComponent(query)}`,
    undefined,
    accessToken,
  )
  return normalizeRoomArray(data)
}

export async function getRoomPosts(accessToken: string, roomId: string) {
  const data = await safeFetch<unknown>(
    `/rooms/${roomId}/posts`,
    undefined,
    accessToken,
  )
  return normalizePosts(data)
}

export async function createPost(
  accessToken: string,
  body: string,
  roomId: number,
  verseKey: string,
  lens: string,
) {
  const [chapterId, verseFrom] = verseKey.split(":").map(Number)

  const data = await safeFetch<unknown>(
    "/posts",
    {
      method: "POST",
      body: JSON.stringify({
        post: {
          body,
          roomId,
          status: 0,
          draft: false, // ✅ FIX
          references: [
            {
              chapterId,
              from: verseFrom,
              to: verseFrom,
            },
          ],
          tags: [lens],
        },
      }),
    },
    accessToken,
  )

  return normalizePost(pickPayload(data, ["post", "data"]) ?? data)
}
export async function deletePost(accessToken: string, postId: string) {
  const data = await safeFetch<unknown>(
    `/posts/${postId}`,
    { method: "DELETE" },
    accessToken,
  )

  return Boolean(data ?? true)
}

export async function likePost(accessToken: string, postId: string) {
  const data = await safeFetch<unknown>(
    `/posts/${postId}/like`,
    { method: "POST" },
    accessToken,
  )

  return Boolean(data)
}

export async function getComments(accessToken: string, postId: string) {
  const data = await safeFetch<unknown>(
    `/posts/${postId}/comments`,
    undefined,
    accessToken,
  )
  return normalizeComments(data)
}

export async function createComment(accessToken: string, postId: string, body: string) {
  const data = await safeFetch<unknown>(
    `/posts/${postId}/comments`,
    {
      method: "POST",
      body: JSON.stringify({ body }),
    },
    accessToken,
  )

  return normalizeComment(pickPayload(data, ["comment", "data"]) ?? data)
}

export async function bookmarkVerse(accessToken: string, verseKey: string) {
  const data = await safeFetch<unknown>(
    "/bookmarks",
    {
      method: "POST",
      body: JSON.stringify({ verse_key: verseKey }),
    },
    accessToken,
  )

  return Boolean(data)
}

export async function getBookmarks(accessToken: string) {
  const data = await safeFetch<unknown>("/bookmarks", undefined, accessToken)
  return normalizeBookmarks(data)
}

export async function getCollections(accessToken: string) {
  const data = await safeFetch<unknown>("/collections?first=1", undefined, accessToken)
  return normalizeCollections(data)
}

export async function createCollection(accessToken: string, name: string) {
  const data = await safeFetch<unknown>(
    "/collections",
    {
      method: "POST",
      body: JSON.stringify({ name }),
    },
    accessToken,
  )

  return normalizeCollections({ collections: [pickPayload(data, ["collection", "data"]) ?? data] })[0] ?? null
}

export async function addToCollection(accessToken: string, collectionId: string, verseKey: string) {
  const data = await safeFetch<unknown>(
    `/collections/${collectionId}/verses`,
    {
      method: "POST",
      body: JSON.stringify({ verse_key: verseKey }),
    },
    accessToken,
  )

  return Boolean(data)
}

export async function createNote(accessToken: string, verseKey: string, body: string) {
  const data = await safeFetch<unknown>(
    "/notes",
    {
      method: "POST",
      body: JSON.stringify({ verse_key: verseKey, body }),
    },
    accessToken,
  )

  return normalizeNotes({ notes: [pickPayload(data, ["note", "data"]) ?? data] })[0] ?? null
}

export async function getNotes(accessToken: string) {
  const data = await safeFetch<unknown>("/notes", undefined, accessToken)
  return normalizeNotes(data)
}

export async function getUserProfile(accessToken: string) {
  const result = await safeFetchResult<unknown>(
    "/users/me",
    undefined,
    accessToken,
  )

  if (result.error?.status === 404) {
    return null // ✅ handle gracefully
  }

  return normalizeProfile(result.data)
}
export async function getStreaks(accessToken: string) {
  const data = await safeFetch<unknown>("/users/me/streaks", undefined, accessToken)
  return normalizeStreak(data)
}

export async function getActivityDays(accessToken: string) {
  const data = await safeFetch<unknown>(
    "/users/me/activity-days",
    undefined,
    accessToken,
  )
  return normalizeActivityDays(data)
}

export async function getGoals(accessToken: string) {
  const data = await safeFetch<unknown>("/users/me/goals", undefined, accessToken)
  return normalizeGoals(data)
}

export async function createGoal(accessToken: string, type: string, target: number) {
  const data = await safeFetch<unknown>(
    "/users/me/goals",
    {
      method: "POST",
      body: JSON.stringify({ type, target }),
    },
    accessToken,
  )

  return normalizeGoals({ goals: [pickPayload(data, ["goal", "data"]) ?? data] })[0] ?? null
}

export async function logReadingSession(accessToken: string, verseKey: string, duration: number) {
  const data = await safeFetch<unknown>(
    "/reading-sessions",
    {
      method: "POST",
      body: JSON.stringify({ verse_key: verseKey, duration }),
    },
    accessToken,
  )

  return Boolean(data)
}

export async function fetchVerseByKey(verseKey: string) {
  const data = await safeFetch<unknown>(
    `/verses/by_key/${verseKey}?words=true&translations=131&tafsirs=169`,
    { headers: { 'x-client-id': CLIENT_ID } },  // ← add this
    undefined,
    false,
    CONTENT_BASE,
  )
  return normalizeVerse(data)
}

export async function fetchAudio(verseKey: string, recitationId = 7) {
  const data = await safeFetch<unknown>(
    `/recitations/${recitationId}/by_ayah/${verseKey}`,
    { headers: { 'x-client-id': CLIENT_ID } },  // ← add this
    undefined,
    false,
    CONTENT_BASE,
  )
  return normalizeAudio(data, verseKey)
}

export async function fetchTafsir(verseKey: string, tafsirId = 169) {
  const data = await safeFetch<unknown>(
    `/tafsirs/${tafsirId}/verses/${verseKey}`,
    { headers: { 'x-client-id': CLIENT_ID } },  // ← add this
    undefined,
    false,
    CONTENT_BASE,
  )
  return normalizeTafsir(data)
}


export async function fetchChapter(chapterNumber: number) {
  const data = await safeFetch<unknown>(
    `/chapters/${chapterNumber}`,
    undefined,
    undefined,
    false,
    CONTENT_BASE,
  )

  return normalizeChapter(data)
}

export async function fetchRandomVerse() {
  const data = await safeFetch<unknown>(
    "/verses/random?translations=131",
    undefined,
    undefined,
    false,
    CONTENT_BASE,
  )

  return normalizeVerse(data)
}

export async function getAllSurahs(): Promise<LegacySurah[]> {
  const data = await safeFetch<unknown>("/chapters", undefined, undefined, false, CONTENT_BASE)
  const payload = pickPayload(data, ["chapters", "data"])

  return asArray(payload).map((entry) => {
    const record = asRecord(entry)
    return {
      id: readNumber(record?.id),
      number: readNumber(record?.id),
      name: readString(record?.name_simple) || readString(record?.name),
      nameArabic: readString(record?.name_arabic),
      revelationType: (readString(record?.revelation_place) || "Meccan") as LegacySurah["revelationType"],
      numberOfAyahs: readNumber(record?.verses_count),
    }
  })
}
