export const MS_PER_DAY = 86_400_000
export const LAUNCH_DATE = new Date("2026-04-06T00:00:00.000Z")

export const LENSES = [
  "vocabulary",
  "structure",
  "context",
  "audience",
  "relevance",
] as const

export type Lens = (typeof LENSES)[number]

export const LENS_LABELS: Record<Lens, string> = {
  vocabulary: "Language Lens",
  structure: "Quranic World",
  context: "Personal Experience",
  audience: "Connections",
  relevance: "General Lessons",
}

export const LENS_PROMPTS: Record<Lens, string[]> = {
  vocabulary: [
    "What is the purpose of this Ayah and each part of it being stated?",
    "Why was it said in this particular way with these particular words?",
    "What can I appreciate through word order and grammar—especially where there is added emphasis or features that go against the expected norm?",
  ],
  structure: [
    "What is the world of Revelation? How does understanding the historical landscape, the companions, and the social context of the Prophet (SAW) enhance my understanding of the Ayah?",
    "What is the historical context of the past? How can learning about the specific nations and civilizations mentioned in the Qur'an help me grasp the deeper significance of these stories?",
    "How does the wider world of creation relate? How does reflecting on the expansive universe and natural laws described in the Qur'an help me better appreciate the greatness of the Creator?",
  ],
  context: [
    "What does this Ayah mean to me? This is the foundational question of this lens, shifting the focus from objective analysis to personal reflection.",
    "When Allah trusts you with a trial, then why do you not trust Allah's plan and yourself?",
    "What spiritual transformation is this verse calling me toward?",
  ],
  audience: [
    "Are there specific words, concepts, or themes recurring within this Surah that act as 'anchors' to reveal a deeper, underlying meaning or structure?",
    "How does the verse I am reading connect to the verses immediately preceding and following it, and how does this flow impact the overall message of the Surah?",
    "How can I connect this specific Ayah to other parts of the Qur'an or supporting narrations (Hadith) to better contextualize and enrich my understanding of the subject matter?",
  ],
  relevance: [
    "How can I express the basic meaning of this Ayah as a general principle, lesson, or a fact of life?",
    "To what other cases is this general point relevant, and what analogous situations help me to better appreciate the wisdom of this Ayah?",
    "What change points does it contain? In other words, what does this Ayah imply in terms of something that would affect a change, elicit a spiritual response, or inspire me to turn to Allah and ask for something?",
  ],
}

const CHAPTER_VERSE_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
  111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73,
  54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49,
  62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28,
  28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20,
  15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
]

export function getStudyDateKey(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    .toISOString()
    .slice(0, 10)
}

export function getTodayDayNumber(now = Date.now()) {
  const days = Math.floor((now - LAUNCH_DATE.getTime()) / MS_PER_DAY)
  return Math.max(days, 0) + 1
}

export function getTodayVerseNumber(now = Date.now()) {
  const days = Math.floor((now - LAUNCH_DATE.getTime()) / MS_PER_DAY)
  return ((Math.max(days, 0) % 6236) + 1)
}

export function getTodayLens(now = Date.now()): Lens {
  return LENSES[Math.floor(now / MS_PER_DAY) % LENSES.length]
}

export function getVerseKeyFromOrdinal(verseNumber: number) {
  let remaining = verseNumber

  for (let chapter = 0; chapter < CHAPTER_VERSE_COUNTS.length; chapter += 1) {
    const versesInChapter = CHAPTER_VERSE_COUNTS[chapter]
    if (remaining <= versesInChapter) {
      return `${chapter + 1}:${remaining}`
    }
    remaining -= versesInChapter
  }

  return "1:1"
}

export function getTodayVerseKey(now = Date.now()) {
  return getVerseKeyFromOrdinal(getTodayVerseNumber(now))
}

export function isSameStudyDate(dateString: string, comparison = new Date()) {
  return dateString.slice(0, 10) === getStudyDateKey(comparison)
}
