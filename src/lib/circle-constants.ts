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
  vocabulary: "Vocabulary",
  structure: "Structure",
  context: "Context",
  audience: "Audience",
  relevance: "Relevance",
}

export const LENS_PROMPTS: Record<Lens, string[]> = {
  vocabulary: [
    "Which word in this verse stands out most to you? Why?",
    "What deeper meanings could this word have?",
    "Is there a reason Allah used this word instead of another?",
  ],
  structure: [
    "What's the order of ideas in this verse, and why might it matter?",
    "Does the sentence structure change the tone or emphasis?",
    "Is there repetition or symmetry that catches your attention?",
  ],
  context: [
    "What situation might this verse be responding to?",
    "Why do you think Allah revealed this message at that time?",
    "Does this connect to a historical event or broader theme?",
  ],
  audience: [
    "Who is Allah speaking to in this verse?",
    "What message is being sent to that audience?",
    "How would this verse feel if it were addressing you personally?",
  ],
  relevance: [
    "How is this verse relevant to something you're going through?",
    "What emotions or thoughts does this verse trigger today?",
    "What change can you make in your life after reading this?",
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
