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
const USER_BASE = `${publicConfig.QF_API_URL}/quran-reflect/v1`   // rooms, posts, comments, profile
const AUTH_BASE = `${publicConfig.QF_API_URL}/auth/v1`             // bookmarks, notes, streaks, goals
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
    "Accept": "application/json",
    "x-client-id": CLIENT_ID,
    ...(accessToken ? { "x-auth-token": accessToken } : {}),
  }
}

function normalizeApiError(status: number, statusText: string, rawBody: string): QfApiError {
  let parsed: Record<string, unknown> | null = null
  if (rawBody) {
    try { parsed = JSON.parse(rawBody) as Record<string, unknown> } catch { parsed = null }
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
      console.error(`QF API request failed for ${path}: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`)
      return { data: null, error }
    }
    return { data: (await response.json()) as T, error: null }
  } catch (error) {
    console.error(`QF API request failed for ${path}:`, error)
    return { data: null, error: { status: 0, statusText: "Network Error", message: "The request could not be completed." } }
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
    if (key in record) return record[key]
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
      resource_name: readString(record?.resource_name) || readString(resource?.name) || readString(record?.name),
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
      translation: { text: readString(translation?.text) || readString(record?.translation) },
      transliteration: { text: readString(transliteration?.text) || readString(record?.transliteration) },
    }
  })
}

function normalizeVerse(source: unknown): Verse | null {
  const record = asRecord(pickPayload(source, ["verse", "data"]))
  if (!record) return null

  const rawTranslations = asArray(record.translations)
  const rawWords = asArray(record.words)

  // QF quirk: when words=true, translations come embedded in each word,
  // not as a top-level verse.translations array. Build a verse-level
  // translation from word translations when translations is empty.
  let translations: Translation[] = normalizeTranslations(rawTranslations)
  if (translations.length === 0 && rawWords.length > 0) {
    const wordTexts = rawWords.map((w) => {
      const r = asRecord(w)
      return asRecord(r?.translation)?.text ?? ""
    }).filter(Boolean)
    translations = [{
      id: 131,
      text: wordTexts.join(" "),
      resource_name: "Word-by-word (QF)",
    }]
  }

  return {
    verse_key: readString(record.verse_key),
    verse_number: readNumber(record.verse_number),
    text_uthmani: readString(record.text_uthmani),
    translations,
    words: normalizeWords(rawWords),
    audio: readString(record.audio),
  }
}

function normalizeTafsir(source: unknown, verseKey?: string): Tafsir | null {
  const record = asRecord(pickPayload(source, ["tafsir", "data"]))
  if (!record) return null
  // verse_key is stored as a key in the verses dict, e.g. { "1:1": {...} }
  const verses = asRecord(record.verses)
  const verseEntry = verses ? asRecord(verses[verseKey ?? ""]) : null
  return {
    verse_key: readString(verseEntry?.verse_key) || verseKey || "",
    text: readString(record.text),
    resource_name: readString(record.resource_name) || readString(asRecord(record.resource_name)?.name) || "Ibn Kathir",
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
  const files = asArray(asRecord(source)?.audio_files)
  const fileRecord = asRecord(files[0])
  if (!fileRecord) return null
  const rawUrl = readString(fileRecord.url)
  return {
    verse_key: verseKey,
    url: rawUrl ? (rawUrl.startsWith("http") ? rawUrl : `https://verses.quran.foundation/${rawUrl}`) : "",
    duration: undefined,
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
    invite_code: readString(record.invite_code) || readString(record.inviteCode) || readString(record.url) || readString(record.subdomain) || undefined,
  }
}

function normalizeRoomArray(source: unknown): Room[] {
  const payload = pickPayload(source, ["rooms", "data"])
  return asArray(payload).map((entry) => normalizeRoom(entry)).filter((entry): entry is Room => Boolean(entry))
}


function normalizeMembers(source: unknown): RoomMember[] {
  const payload = pickPayload(source, ["members", "data"])
  return asArray(payload).map((entry) => normalizeMember(entry)).filter((entry): entry is RoomMember => Boolean(entry))
}



function normalizeComments(source: unknown): Comment[] {
  const payload = pickPayload(source, ["comments", "data"])
  return asArray(payload).map((entry) => normalizeComment(entry)).filter((entry): entry is Comment => Boolean(entry))
}

function getLensFromTags(tags: string[]) {
  return tags.find((tag) => LENSES.includes(tag as (typeof LENSES)[number])) ?? "relevance"
}



function normalizeNotes(source: unknown): Note[] {
  const payload = pickPayload(source, ["notes", "data"])
  return asArray(payload).map((entry) => {
    const record = asRecord(entry)
    return { id: readString(record?.id), verse_key: readString(record?.verse_key), body: readString(record?.body), created_at: readString(record?.created_at) }
  })
}

function normalizeProfile(source: unknown): UserProfile | null {
  const record = asRecord(pickPayload(source, ["user", "profile", "data"]))
  if (!record) return null
  return {
    user_id: readString(record.user_id) || readString(record.id) || String(readNumber(record.id)),
    username: readString(record.username) || readString(record.name),
    avatar: readString(record.avatar) || readString(asRecord(record.avatarUrl)?.small) || readString(asRecord(record.avatarUrl)?.medium) || undefined,
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
    return { date: readString(record?.date), active: readBoolean(record?.active, true) }
  })
}

function normalizeGoals(source: unknown): Goal[] {
  if (!source) return []
  const payload = pickPayload(source, ["goals", "data"])
  return asArray(payload).map((entry) => {
    const record = asRecord(entry)
    return { id: readString(record?.id), type: readString(record?.type), target: readNumber(record?.target), progress: readNumber(record?.progress), created_at: readString(record?.created_at) }
  })
}

export function generateRoomUrl(name: string) {
  return `${name.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40)}-${Date.now().toString(36)}`
}

// ─── ROOMS (USER_BASE) ────────────────────────────────────────────────────────

export async function createRoomResult(accessToken: string, name: string, description = "", url = generateRoomUrl(name), isPublic = true) {
  const result = await safeFetchResult<unknown>("/rooms/groups", { method: "POST", body: JSON.stringify({ name, description, url, public: isPublic }) }, accessToken)
  return { room: normalizeRoom(result.data), error: result.error }
}

export async function createRoom(accessToken: string, name: string, description = "", url = generateRoomUrl(name), isPublic = true) {
  const result = await createRoomResult(accessToken, name, description, url, isPublic)
  return result.room
}

export async function getRoom(accessToken: string, roomId: string) {
  const data = await safeFetch<unknown>(`/rooms/${roomId}`, {}, accessToken)
  return normalizeRoom(data)
}

export async function getRoomMembers(accessToken: string, roomId: string) {
  const data = await safeFetch<unknown>(`/rooms/${roomId}/members`, {}, accessToken)
  return normalizeMembers(data)
}

export async function joinRoom(accessToken: string, roomId: string) {
  const data = await safeFetch<unknown>(
    `/rooms/${roomId}/join`,
    { method: "POST" },
    accessToken,
  )
  // API returns { joined: boolean }
  const record = asRecord(data)
  return record?.joined === true || Boolean(data)
}

export async function getPublicCircles(accessToken: string, query = "quran") {
  const data = await safeFetch<unknown>(
    `/rooms/search?query=${encodeURIComponent(query)}&limit=20`,
    undefined,
    accessToken,
  )
  return normalizeRoomArray(data)
}
export async function acceptInviteByToken(
  accessToken: string,
  url: string,
  token: string
) {
  return Boolean(
    await safeFetch<unknown>(
      `/rooms/group/${encodeURIComponent(url)}/accept/${encodeURIComponent(token)}`,
      { method: "GET" },
      accessToken
    )
  )
}
export async function leaveRoom(accessToken: string, roomId: string) {
  return Boolean(await safeFetch<unknown>(`/rooms/${roomId}/leave`, { method: "POST" }, accessToken))
}

export async function inviteToRoom(accessToken: string, roomId: string, userId: string) {
  return Boolean(await safeFetch<unknown>(`/rooms/${roomId}/invite`, { method: "POST", body: JSON.stringify({ userIds: [userId] }) }, accessToken))
}

export async function getUserRooms(accessToken: string) {
  const data = await safeFetch<unknown>("/users/my-rooms?limit=5", {}, accessToken)
  return normalizeRoomArray(data)
}

export async function getUserRoomsResult(accessToken: string) {
  const result = await safeFetchResult<unknown>("/users/my-rooms?limit=5", {}, accessToken)
  return { rooms: normalizeRoomArray(result.data), error: result.error }
}

export async function searchRooms(accessToken: string, query: string) {
  const data = await safeFetch<unknown>(`/rooms/search?query=${encodeURIComponent(query)}`, undefined, accessToken)
  return normalizeRoomArray(data)
}

export async function getRoomByUrl(accessToken: string, url: string) {
  const data = await safeFetch<unknown>(`/rooms/profile-by-url?url=${encodeURIComponent(url.trim())}`, undefined, accessToken)
  return normalizeRoom(data)
}

export async function getRoomByInviteCode(accessToken: string, inviteCode: string) {
  // First try searching by name (invite code might match room name)
  const rooms = await searchRooms(accessToken, inviteCode.trim())
  const exactMatch = rooms?.find(
    (room) => room.invite_code?.toLowerCase() === inviteCode.trim().toLowerCase(),
  )
  if (exactMatch) return exactMatch

  // Fallback: try looking up by URL (invite code might be the room's url/subdomain field)
  return await getRoomByUrl(accessToken, inviteCode)
}

export async function getRoomPosts(accessToken: string, roomId: string) {
  let timedOut = false
  const timeout = setTimeout(() => { timedOut = true }, 20_000)

  try {
    const data = await safeFetch<unknown>(`/rooms/${roomId}/posts`, {}, accessToken)
    clearTimeout(timeout)

    if (data == null) return []

    return normalizePosts(data)
  } catch (err: unknown) {
    clearTimeout(timeout)

    if (timedOut) {
      console.warn(`[getRoomPosts] Timed out for room ${roomId}`)
      throw new Error(`Request timed out for room ${roomId}`)
    }

    console.warn(`[getRoomPosts] Failed for room ${roomId}:`, err)
    throw err
  }
}

export async function createPost(accessToken: string, body: string, roomId: string | number, verseKey: string, lens: string) {
  const [chapterId, verseFrom] = verseKey.split(":").map(Number)
  const payload = {
    post: {
      body,
      roomId: Number(roomId),
      roomPostStatus: 0,
      draft: false,
      references: [{ chapterId, from: verseFrom, to: verseFrom }],
      tags: [lens],
      mentions: [],
      postAsAuthorId: "",
      publishedAt: new Date().toISOString()
    },
  }

  const result = await safeFetchResult<unknown>("/posts", { method: "POST", body: JSON.stringify(payload) }, accessToken)

  if (result.error) {
    return null
  }

  return normalizePost(pickPayload(result.data, ["post", "data"]) ?? result.data)
}

export async function likePost(accessToken: string, postId: string) {
  return Boolean(await safeFetch<unknown>(`/posts/${postId}/like`, { method: "POST" }, accessToken))
}

export async function getComments(accessToken: string, postId: string) {
  const data = await safeFetch<unknown>(`/posts/${postId}/comments`, {}, accessToken)
  return normalizeComments(data)
}

export async function createComment(accessToken: string, postId: string, body: string) {
  const data = await safeFetch<unknown>(`/posts/${postId}/comments`, { method: "POST", body: JSON.stringify({ body }) }, accessToken)
  return normalizeComment(pickPayload(data, ["comment", "data"]) ?? data)
}

// ─── AUTH/PERSONAL DATA (AUTH_BASE) ──────────────────────────────────────────



export async function getStreaks(accessToken: string) {
  const data = await safeFetch<unknown>("/streaks?first=1&status=ACTIVE&type=QURAN", {}, accessToken, true, AUTH_BASE)
  return normalizeStreak(data)
}

export async function getActivityDays(accessToken: string) {
  const data = await safeFetch<unknown>("/activity-days?first=20", {}, accessToken, true, AUTH_BASE)
  return normalizeActivityDays(data)
}


export async function createGoal(accessToken: string, type: string, target: number) {
  const data = await safeFetch<unknown>("/goals", { method: "POST", body: JSON.stringify({ type, target }) }, accessToken, true, AUTH_BASE)
  return normalizeGoals({ goals: [pickPayload(data, ["goal", "data"]) ?? data] })[0] ?? null
}

export async function bookmarkVerse(accessToken: string, verseKey: string) {
  const [chapter, verse] = verseKey.split(":").map(Number)
  const data = await safeFetch<unknown>(
    "/bookmarks",
    { method: "POST", body: JSON.stringify({ key: chapter, type: "ayah", verseNumber: verse, mushaf: 1 }) },
    accessToken, true, AUTH_BASE,
  )
  return Boolean(data)
}

export async function getBookmarks(accessToken: string) {
  const data = await safeFetch<unknown>("/bookmarks?first=20&mushafId=1", {}, accessToken, true, AUTH_BASE)
  return normalizeBookmarks(data)
}

export async function getCollections(accessToken: string) {
  const data = await safeFetch<unknown>("/collections?first=20", {}, accessToken, true, AUTH_BASE)
  return normalizeCollections(data)
}

export async function createCollection(accessToken: string, name: string) {
  const data = await safeFetch<unknown>("/collections", { method: "POST", body: JSON.stringify({ name }) }, accessToken, true, AUTH_BASE)
  return normalizeCollections({ collections: [pickPayload(data, ["collection", "data"]) ?? data] })[0] ?? null
}

export async function addToCollection(accessToken: string, collectionId: string, verseKey: string) {
  const [chapter, verse] = verseKey.split(":").map(Number)
  const data = await safeFetch<unknown>(
    `/collections/${collectionId}/bookmarks`,
    { method: "POST", body: JSON.stringify({ key: chapter, type: "ayah", verseNumber: verse, mushaf: 1 }) },
    accessToken, true, AUTH_BASE,
  )
  return Boolean(data)
}

export async function createNote(accessToken: string, verseKey: string, body: string) {
  const range = `${verseKey}-${verseKey}`
  const data = await safeFetch<unknown>("/notes", { method: "POST", body: JSON.stringify({ body, saveToQR: false, ranges: [range] }) }, accessToken, true, AUTH_BASE)
  return normalizeNotes({ notes: [pickPayload(data, ["note", "data"]) ?? data] })[0] ?? null
}

export async function getNotes(accessToken: string) {
  const data = await safeFetch<unknown>("/notes?limit=20", {}, accessToken, true, AUTH_BASE)
  return normalizeNotes(data)
}

export async function logReadingSession(accessToken: string, verseKey: string, duration: number) {
  const data = await safeFetch<unknown>("/reading-sessions", { method: "POST", body: JSON.stringify({ verse_key: verseKey, duration }) }, accessToken, true, AUTH_BASE)
  return Boolean(data)
}

// ─── CONTENT (via Next.js API routes — server-side token) ────────────────────

export async function fetchRandomVerse() {
  const data = await safeFetch<unknown>("/verses/random?translations=131", undefined, undefined, false, CONTENT_BASE)
  return normalizeVerse(data)
}

export async function fetchVerseByKey(verseKey: string) {
  try {
    const res = await fetch(`/api/content/verse?verseKey=${encodeURIComponent(verseKey)}`)
    if (!res.ok) return null
    const data = await res.json()
    return normalizeVerse(data.verse)
  } catch { return null }
}

export async function fetchAudio(verseKey: string) {
  try {
    const res = await fetch(`/api/content/verse?verseKey=${encodeURIComponent(verseKey)}`)
    if (res.status >= 500 || res.status === 504 || res.status === 503 || res.status === 502) {
      // Server error — throw so fetchWithRetry retries
      throw new Error(`Server error: ${res.status}`)
    }
    if (!res.ok) return null
    const data = await res.json()
    return normalizeAudio(data.audio, verseKey)
  } catch (err) {
    // Network errors also throw and trigger retry via fetchWithRetry
    console.warn("[fetchAudio]", err)
    return null
  }
}

export async function fetchTafsir(verseKey: string, tafsirId = 169) {
  try {
    const res = await fetch(`/api/content/tafsir?verseKey=${encodeURIComponent(verseKey)}&tafsirId=${tafsirId}`)
    if (!res.ok) return null
    const data = await res.json()
    return normalizeTafsir(data.tafsir, verseKey)
  } catch { return null }
}

export async function fetchChapter(chapterNumber: number) {
  try {
    const res = await fetch(`/api/content/chapters`)
    if (!res.ok) return null
    const data = await res.json()
    const chapters = asArray(data.chapters ?? pickPayload(data, ["chapters", "data"]))
    const chapter = chapters.find((c) => readNumber(asRecord(c)?.id) === chapterNumber)
    return normalizeChapter(chapter ? { chapter } : null)
  } catch { return null }
}

export async function getAllSurahs(): Promise<LegacySurah[]> {
  try {
    const res = await fetch(`/api/content/chapters`)
    if (!res.ok) return []
    const data = await res.json()
    const payload = asArray(data.chapters ?? pickPayload(data, ["chapters", "data"]))
    return payload.map((entry) => {
      const record = asRecord(entry)
      if (!record) return null
      return {
        id: readNumber(record.id),
        number: readNumber(record.id),
        name: readString(record.name_simple) || readString(record.name_complex) || readString(record.name),
        nameArabic: readString(record.name_arabic),
        revelationType: (readString(record.revelation_place) === "madinah" ? "Medinan" : "Meccan") as LegacySurah["revelationType"],
        numberOfAyahs: readNumber(record.verses_count),
      }
    }).filter((s): s is LegacySurah => s !== null && s.id > 0)
  } catch { return [] }
}


export async function deletePost(accessToken: string, postId: string) {
  const response = await fetch(`${USER_BASE}/posts/${postId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", "Accept": "application/json", "x-auth-token": accessToken, "x-client-id": CLIENT_ID },
  })
  return response.ok
}

export async function getUserProfile(accessToken: string) {
  const result = await safeFetchResult<unknown>("/users/profile", {}, accessToken, true, USER_BASE)
  if (result.error?.status === 404 || result.error?.status === 0) return null
  return normalizeProfile(result.data)
}

export async function getGoals(accessToken: string) {
  const data = await safeFetch<unknown>(
    "/goals/get-todays-plan?type=QURAN_TIME&mushafId=1",
    { method: "GET" },
    accessToken,
    true,
    AUTH_BASE,
  )
  return normalizeGoals(data ?? { goals: [] })
}

function normalizePost(source: unknown): Post | null {
  const record = asRecord(source)
  if (!record) return null
  const tags = asArray(record.tags).map((tag) => {
    // QF returns tags as objects { id, name, language } or as strings
    const r = asRecord(tag)
    return r ? readString(r.name) : readString(tag)
  }).filter(Boolean)
  const references = asArray(record.references)
  const firstReference = asRecord(references[0])
  const chapterId = readNumber(firstReference?.chapterId)
  const verseFrom = readNumber(firstReference?.from)
  const verseKeyTag = tags.find((tag) => /^\d+:\d+$/.test(tag)) || (chapterId && verseFrom ? `${chapterId}:${verseFrom}` : undefined)

  // QF returns author as nested object
  const author = asRecord(record.author)
  const username =
    readString(record.username) ||
    readString(record.name) ||
    readString(author?.username) ||
    readString(author?.displayName) ||
    [readString(author?.firstName), readString(author?.lastName)].filter(Boolean).join(" ") ||
    "Anonymous"

  const avatar =
    readString(record.avatar) ||
    readString(asRecord(record.avatarUrls)?.small) ||
    readString(asRecord(author?.avatarUrls)?.small) ||
    undefined

  return {
    id: readString(record.id) || String(readNumber(record.id)),
    room_id: readString(record.room_id) || String(readNumber(record.roomId)),
    user_id: readString(record.user_id) || readString(record.authorId) || String(readNumber(record.userId)),
    username,
    avatar,
    body: readString(record.body),
    tags,
    lens: getLensFromTags(tags),
    verse_key: verseKeyTag,
    created_at: readString(record.created_at) || readString(record.createdAt) || new Date().toISOString(),
    like_count: readNumber(record.like_count) || readNumber(record.likeCount) || readNumber(record.likesCount),
    comment_count: readNumber(record.comment_count) || readNumber(record.commentCount) || readNumber(record.commentsCount),
    liked_by_me: readBoolean(record.liked_by_me) || readBoolean(record.isLiked) || readBoolean(record.likedByMe),
  }
}
function normalizePosts(source: unknown): Post[] {
  const payload = pickPayload(source, ["posts", "data"])

  return asArray(payload)
    .map((entry) => normalizePost(entry))
    .filter((entry): entry is Post => Boolean(entry))
}

function normalizeMember(source: unknown): RoomMember | null {
  const record = asRecord(source)
  if (!record) return null
  const username =
    readString(record.username) ||
    readString(record.name) ||
    readString(record.displayName) ||
    [readString(record.firstName), readString(record.lastName)].filter(Boolean).join(" ") ||
    "Member"
  return {
    user_id: readString(record.user_id) || readString(record.id) || String(readNumber(record.id)),
    username,
    avatar:
      readString(record.avatar) ||
      readString(asRecord(record.avatarUrl)?.small) ||
      readString(asRecord(record.avatarUrls)?.small) ||
      undefined,
    joined_at: readString(record.joined_at) || readString(record.createdAt) || new Date().toISOString(),
    has_reflected_today: readBoolean(record.has_reflected_today),
  }
}

function normalizeComment(source: unknown): Comment | null {
  const record = asRecord(source)
  if (!record) return null
  const author = asRecord(record.author)
  const username =
    readString(record.username) ||
    readString(record.name) ||
    readString(author?.username) ||
    readString(author?.displayName) ||
    [readString(author?.firstName), readString(author?.lastName)].filter(Boolean).join(" ") ||
    "Anonymous"
  return {
    id: readString(record.id),
    post_id: readString(record.post_id) || readString(record.postId),
    user_id: readString(record.user_id) || readString(record.authorId),
    username,
    body: readString(record.body),
    created_at: readString(record.created_at) || readString(record.createdAt) || new Date().toISOString(),
  }
}

function normalizeBookmarks(source: unknown): Bookmark[] {
  // QF auth/v1 returns { data: { bookmarks: [...] } } or { data: [...] }
  const record = asRecord(source)
  const inner = asRecord(record?.data)
  const payload = asArray(inner?.bookmarks ?? record?.data ?? pickPayload(source, ["bookmarks", "data"]))
  return payload.map((entry) => {
    const r = asRecord(entry)
    const verseNum = readNumber(r?.verseNumber)
    const key = readNumber(r?.key)
    const verse_key = readString(r?.verse_key) || (key && verseNum ? `${key}:${verseNum}` : "")
    return {
      id: readString(r?.id),
      verse_key,
      created_at: readString(r?.created_at) || readString(r?.createdAt) || new Date().toISOString(),
    }
  })
}

function normalizeCollections(source: unknown): VerseCollection[] {
  const record = asRecord(source)
  const inner = asRecord(record?.data)
  const payload = asArray(inner?.collections ?? record?.data ?? pickPayload(source, ["collections", "data"]))
  return payload.map((entry) => {
    const r = asRecord(entry)
    return {
      id: readString(r?.id),
      name: readString(r?.name),
      verse_count: readNumber(r?.verse_count) || readNumber(r?.bookmarksCount) || readNumber(r?.count),
      created_at: readString(r?.created_at) || readString(r?.createdAt) || new Date().toISOString(),
    }
  })
}