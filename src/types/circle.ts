export interface Room {
  id: string
  name: string
  description?: string
  member_count: number
  created_by: string
  created_at: string
  invite_code?: string
}

export interface RoomMember {
  user_id: string
  username: string
  avatar?: string
  joined_at: string
  has_reflected_today: boolean
}

export interface Post {
  id: string
  room_id: string
  user_id: string
  username: string
  avatar?: string
  body: string
  tags: string[]
  lens: string
  verse_key?: string
  created_at: string
  like_count: number
  comment_count: number
  liked_by_me: boolean
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  username: string
  body: string
  created_at: string
}

export interface Verse {
  verse_key: string
  verse_number: number
  text_uthmani: string
  translations: Translation[]
  words: Word[]
  audio?: string
}

export interface Translation {
  id: number
  text: string
  resource_name: string
}

export interface Word {
  position: number
  text_uthmani: string
  translation: { text: string }
  transliteration: { text: string }
}

export interface Tafsir {
  verse_key: string
  text: string
  resource_name: string
}

export interface UserStreak {
  current_streak: number
  max_streak: number
  last_activity: string
}

export interface Chapter {
  id: number
  name_simple: string
  name_arabic?: string
  translated_name?: {
    language_name?: string
    name?: string
  }
  verses_count?: number
}

export interface AudioRecitation {
  verse_key: string
  url: string
  duration?: number
}

export interface Bookmark {
  id: string
  verse_key: string
  created_at: string
}

export interface VerseCollection {
  id: string
  name: string
  verse_count: number
  created_at: string
}

export interface Note {
  id: string
  verse_key: string
  body: string
  created_at: string
}

export interface ActivityDay {
  date: string
  active: boolean
}

export interface Goal {
  id: string
  type: string
  target: number
  progress: number
  created_at: string
}

export interface UserProfile {
  user_id: string
  username: string
  avatar?: string
  quran_account_tag?: string
}

export interface DailyAyahPayload {
  date: string
  verse_key: string
  verse_number: number
  day_number: number
  lens: string
  verse: Verse
  chapter: Chapter | null
}
