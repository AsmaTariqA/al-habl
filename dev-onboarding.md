# AL-HABL — DEVELOPER ONBOARDING
### Complete context for the AI Study Companion feature
### Read this entirely before writing a single line of code.

---

## 1. WHAT IS AL-HABL

**Al-Habl** (The Rope) — inspired by Surah Al-Imran 3:103:
> "Hold firmly to the rope of Allah, all together."

A structured daily Quran study circle. Not a reader. Not a chatbot. Not a social feed.

**Core loop:**
1. User joins a circle of 4–5 real humans
2. Every day, one ayah drops into the circle
3. Members study it through the **5 Lenses Framework**
4. Members post their own reflections
5. All Quran resources surface inline

**What it is NOT:**
- Not AI doing the reflection for the user
- Not a content library
- Not solo — built entirely around human accountability

---

## 2. YOUR SPECIFIC JOB

You are building ONE feature: **The AI Study Companion — "The Librarian"**

**The philosophy:**
The AI is a librarian, not a scholar. It does NOT reflect for the user. It does NOT give opinions. It surfaces verified resources — tafsir, word meanings, historical context — so the USER can do the intellectual and spiritual work themselves.

This is theologically intentional. Reflection on the Quran is the responsibility of the Muslim. The AI assists access to knowledge, not the act of reflection itself.

**What the Librarian does:**
- User reads today's ayah
- User picks a lens (Language, Quranic World, Personal Experience, Connections, General Lessons)
- User reads the lens prompts and tries to answer themselves first
- User can then ask the Librarian questions suited to that lens
- Librarian fetches verified tafsir + word morphology + translations from Quran MCP
- Returns sources and explanations — NOT opinions or personal reflections
- User uses those resources to deepen their own reflection

**What the Librarian does NOT do:**
- Does NOT write reflections for the user
- Does NOT give spiritual advice
- Does NOT say "this ayah means you should..."
- Does NOT hallucinate Islamic content
- Does NOT replace human scholars

---

## 3. THE 5 LENSES FRAMEWORK

This is the intellectual core of the entire app. Every ayah is studied through these 5 lenses:

```typescript
export const LENS_PROMPTS = {
  vocabulary: [
    "What is the purpose of this Ayah and each part of it being stated?",
    "Why was it said in this particular way with these particular words?",
    "What can I appreciate through word order and grammar—especially where there is added emphasis or features that go against the expected norm?"
  ],
  structure: [
    "What is the world of Revelation? How does understanding the historical landscape, the companions, and the social context of the Prophet (SAW) enhance my understanding of the Ayah?",
    "What is the historical context of the past? How can learning about the specific nations and civilizations mentioned in the Qur'an help me grasp the deeper significance of these stories?",
    "How does the wider world of creation relate? How does reflecting on the expansive universe and natural laws described in the Qur'an help me better appreciate the greatness of the Creator?"
  ],
  context: [
    "What does this Ayah mean to me? This is the foundational question of this lens, shifting the focus from objective analysis to personal reflection.",
    "When Allah trusts you with a trial, then why do you not trust Allah's plan and yourself?",
    "What spiritual transformation is this verse calling me toward?"
  ],
  audience: [
    "Are there specific words, concepts, or themes recurring within this Surah that act as 'anchors' to reveal a deeper, underlying meaning or structure?",
    "How does the verse I am reading connect to the verses immediately preceding and following it, and how does this flow impact the overall message of the Surah?",
    "How can I connect this specific Ayah to other parts of the Qur'an or supporting narrations (Hadith) to better contextualize and enrich my understanding of the subject matter?"
  ],
  relevance: [
    "How can I express the basic meaning of this Ayah as a general principle, lesson, or a fact of life?",
    "To what other cases is this general point relevant, and what analogous situations help me to better appreciate the wisdom of this Ayah?",
    "What change points does it contain? In other words, what does this Ayah imply in terms of something that would affect a change, elicit a spiritual response, or inspire me to turn to Allah and ask for something?"
  ]
}
```

Each lens asks different questions. The Librarian's response should be shaped by which lens the user is studying through:

- **Language Lens** → Librarian fetches word morphology, root meanings, concordance, linguistic analysis
- **Quranic World** → Librarian fetches historical context, revelation circumstances, references to civilizations and creation
- **Personal Experience** → Librarian fetches practical tafsir on personal application and spiritual growth
- **Connections** → Librarian fetches related verses and thematic connections across the Quran
- **General Lessons** → Librarian fetches general principles, wisdom, and transformational messages

---

## 4. TECH STACK

```
Framework:    Next.js 15 (App Router)
Language:     TypeScript
Styling:      Tailwind CSS
Auth:         Quran Foundation OAuth2 (PKCE)
Database:     Supabase (minimal — token storage only)
Hosting:      Vercel
AI:           Anthropic Claude API (claude-haiku-4-5-20251001)
MCP:          Quran MCP (mcp.quran.ai) — verified Quran content
```

---

## 5. ENVIRONMENT VARIABLES YOU NEED

Ask Asma for the `.env.local` file. You need:

```bash
# These are already set up — Asma will share
NEXT_PUBLIC_QF_CLIENT_ID=...
QF_CLIENT_SECRET=...
NEXT_PUBLIC_QF_AUTH_URL=...
NEXT_PUBLIC_QF_API_URL=...
NEXT_PUBLIC_QF_REDIRECT_URI=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# You add this yourself
ANTHROPIC_API_KEY=your_key_here
```

Get Anthropic API key at: `console.anthropic.com`
We have $5 credits loaded. Use `claude-haiku-4-5-20251001` model — it's cheap and fast.

---

## 6. QURAN MCP — THE KNOWLEDGE SOURCE

**What it is:**
Quran MCP (`mcp.quran.ai`) is a server built by Quran Foundation themselves. It provides verified, canonical Quran content — Arabic text, translations, tafsir commentary, word morphology. All data comes from quran.com.

**Why we use it:**
- Zero hallucinations on Quranic content
- Verified scholarly tafsir (Ibn Kathir, Al-Tabari, Ibn Ashur, Al-Sa'di, and more)
- Word-level morphology analysis
- Semantic search across the entire Quran
- Built by the same organization running this hackathon

**The judges built this MCP. Using it properly will impress them directly.**

**Available tools in Quran MCP:**
```
fetch_grounding_rules   — Call once per session first
list_editions           — Discover available tafsir/translation editions
fetch_quran             — Get exact Arabic text by verse reference
search_quran            — Semantic search across Quran
fetch_tafsir            — Get tafsir commentary for a verse
search_tafsir           — Search tafsir by topic
fetch_translation       — Get translation in any language
fetch_word_morphology   — Detailed word-level analysis
fetch_word_concordance  — Find all occurrences of a root/word
fetch_quran_metadata    — Structural metadata (surah info, juz, etc.)
```

**Tafsir editions available (use these IDs):**
```
en-ibn-kathir           — Ibn Kathir (English, most accessible)
ar-tabari               — Al-Tabari (Arabic, most detailed)
ar-saadi                — Al-Sa'di (Arabic, clear and practical)
ar-tahrir-wa-tanwir     — Ibn Ashur (Arabic, linguistic depth)
en-maarif-ul-quran      — Maariful Quran (English, Urdu tradition)
```

---

## 7. WHAT YOU ARE BUILDING — EXACT SPECIFICATION

### File 1: `/src/app/api/study/route.ts`
verified knowledge about the Quran — not to reflect for them or give 
spiritual advice.

When a user asks about a verse:
1. Always fetch the relevant content from your tools first
2. Present what the scholars said — clearly and accessibly
3. Never add your own interpretation or opinion
4. Never say "this means you should..." 
5. Keep responses under 200 words
6. Always end with the sources you used
7. If asked something beyond your tools' knowledge, say so honestly
```

**Lens-specific instructions for the system prompt:**
```
vocabulary  → Use fetch_word_morphology and fetch_word_concordance for word analysis
structure   → Use fetch_tafsir focusing on historical context and civilizations mentioned
context     → Use fetch_tafsir with ar-saadi focusing on personal application
audience    → Use fetch_tafsir and search_tafsir to find thematic connections across Quran
relevance   → Use fetch_tafsir for general principles, lessons, and wisdom
```

### File 2: `/src/components/study/StudyLibrarian.tsx`

**Purpose:** UI component shown alongside lens prompts

**Placement in the app:**
- Appears BELOW the lens prompts
- ABOVE the reflection composer
- User sees: Ayah → Lens prompts → [StudyLibrarian] → Write your reflection

**UI flow:**
1. Component shows with heading: `✦ Ask the Librarian`
2. Subtext: `"The Librarian surfaces verified scholarship. The reflection is yours."`
3. Optional question input — placeholder changes based on active lens
4. Submit button: `"Search the Sources"`
5. Loading state: `"Searching verified scholarship..."`
6. Response displays in a card with gold border
7. Citation line at bottom: `"Grounded in quran.ai"`

**Props:**
```typescript
interface StudyLibrarianProps {
  verseKey: string
  selectedLens: string
  arabicText: string
  translationText: string
}
```

**Placeholder text per lens:**
```typescript
const PLACEHOLDERS = {
  vocabulary: "Ask about word meanings, purpose, or what makes this phrasing unique...",
  structure: "Ask about the historical context, revelation circumstances, or creation references...",
  context: "Ask what this verse means for you personally or how to apply it in your life...",
  audience: "Ask how this verse connects to other parts of the Quran or surrounding verses...",
  relevance: "Ask about the fundamental lessons, wisdom, or transformational messages here..."
}
```

---

## 8. COMPLETE CODE — COPY AND ADAPT

### `/src/app/api/study/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { verseKey, lens, arabicText, translationText, question } = await request.json()

    if (!verseKey || !lens) {
      return NextResponse.json(
        { error: 'Missing verseKey or lens' },
        { status: 400 }
      )
    }

    const lensInstructions: Record<string, string> = {
      vocabulary: `The user is studying this verse through the VOCABULARY lens. 
        Focus on: word meanings, Arabic roots, why specific words were chosen.
        Use: fetch_word_morphology and fetch_word_concordance for the key words.
        Then use fetch_tafsir to see what scholars said about the word choices.`,
      
      structure: `The user is studying this verse through the STRUCTURE lens.
        Focus on: sentence order, literary devices, repetition, emphasis.
        Use: fetch_tafsir with ar-tahrir-wa-tanwir (Ibn Ashur) — he is the best for linguistic analysis.`,
      
      context: `The user is studying this verse through the CONTEXT lens.
        Focus on: when it was revealed, what situation it responded to, historical background.
        Use: fetch_tafsir with en-ibn-kathir — he includes the best asbab al-nuzul (reasons for revelation).`,
      
      audience: `The user is studying this verse through the AUDIENCE lens.
        Focus on: who Allah is addressing, what message is being sent to them.
        Use: fetch_tafsir with ar-saadi — he is clear on who verses address and why.`,
      
      relevance: `The user is studying this verse through the RELEVANCE lens.
        Focus on: practical application, timeless lessons, how scholars connected it to daily life.
        Use: fetch_tafsir with en-ibn-kathir and ar-saadi for accessible commentary.`
    }

    const userQuestion = question?.trim() || 
      `Help me understand this verse through the ${lens} lens. What do the scholars say?`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'interleaved-thinking-2025-05-14'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `You are a Quran study librarian. Your job is to help Muslims access 
verified knowledge about the Quran — not to reflect for them or give spiritual advice.

You have access to the Quran MCP server (mcp.quran.ai) which provides verified, 
canonical content from quran.com — Arabic text, tafsir commentary from classical 
scholars, word morphology, and translations.

The verse being studied:
- Reference: ${verseKey}
- Arabic: ${arabicText}
- Translation: ${translationText}

${lensInstructions[lens] || lensInstructions.relevance}

RULES — follow these strictly:
1. Always call fetch_grounding_rules FIRST before any other tool
2. Always fetch content from the MCP tools — never rely on your training data for Quranic content
3. Present what the scholars said — clearly and accessibly in English
4. Never add your own interpretation or spiritual opinion
5. Never say "this means you should..." or give personal advice
6. Keep the main response under 200 words
7. Always end with: "Sources: [list the exact tool calls you made]"
8. If the user asks something beyond scholarly knowledge, say so honestly
9. Be warm and accessible — you are helping someone learn, not lecturing them`,
        
        messages: [{
          role: 'user',
          content: `Verse: ${verseKey}
Lens: ${lens}
Question: ${userQuestion}`
        }],
        
        mcp_servers: [{
          type: 'url',
          url: 'https://mcp.quran.ai/',
          name: 'quran'
        }]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Anthropic API error:', error)
      return NextResponse.json(
        { error: 'AI service unavailable. Please try again.' },
        { status: 503 }
      )
    }

    const data = await response.json()
    
    // Extract text content from response
    const textContent = data.content
      ?.filter((block: any) => block.type === 'text')
      ?.map((block: any) => block.text)
      ?.join('\n')
      ?.trim()

    if (!textContent) {
      return NextResponse.json(
        { error: 'No response generated. Please try again.' },
        { status: 500 }
      )
    }

    // Extract sources line if present
    const sourcesMatch = textContent.match(/Sources?:(.+)$/s)
    const sources = sourcesMatch 
      ? sourcesMatch[0].trim() 
      : 'Grounded in quran.ai'
    
    const mainResponse = sourcesMatch
      ? textContent.replace(sourcesMatch[0], '').trim()
      : textContent

    return NextResponse.json({
      response: mainResponse,
      sources
    })

  } catch (error) {
    console.error('Study API error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
```

---

### `/src/components/study/StudyLibrarian.tsx`

```typescript
'use client'
import { useState } from 'react'

interface StudyLibrarianProps {
  verseKey: string
  selectedLens: string
  arabicText: string
  translationText: string
}

const LENS_PLACEHOLDERS: Record<string, string> = {
  vocabulary: "Ask about a specific word — its root, meaning, or why it was chosen...",
  structure: "Ask about the sentence structure, order of ideas, or literary devices...",
  context: "Ask about when or why this verse was revealed, the historical situation...",
  audience: "Ask about who Allah is speaking to and what message is being sent...",
  relevance: "Ask how scholars understood the timeless lessons in this verse..."
}

const LENS_LABELS: Record<string, string> = {
  vocabulary: "Vocabulary",
  structure: "Structure", 
  context: "Context",
  audience: "Audience",
  relevance: "Relevance"
}

export default function StudyLibrarian({
  verseKey,
  selectedLens,
  arabicText,
**Purpose:** Server-side API route that calls Claude + Quran MCP

**Input (POST body):**
```typescript
{
  verseKey: string        // e.g. "2:255"
  lens: string            // Language | Quranic World | Personal Experience | Connections | General Lessons
  arabicText: string      // Arabic text of the verse (already fetched by app)
  translationText: string // English translation (already fetched by app)
  question: string        // User's specific question (optional)
}
```

**Output:**
```typescript
{
  response: string        // Librarian's answer
  sources: string         // Citation line e.g. "Grounded in quran.ai: fetch_tafsir(2:255, en-ibn-kathir)"
  error?: string          // Only if something went wrong
}
```

**System prompt philosophy — this is critical:**
```
You are a Quran study librarian. Your job is to help Muslims access 

  translationText
}: StudyLibrarianProps) {
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [sources, setSources] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasAsked, setHasAsked] = useState(false)

  async function handleAsk() {
    if (loading) return
    
    setLoading(true)
    setError('')
    setResponse('')
    setSources('')

    try {
      const res = await fetch('/api/study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verseKey,
          lens: selectedLens,
          arabicText,
          translationText,
          question: question.trim()
        })
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      setResponse(data.response)
      setSources(data.sources)
      setHasAsked(true)
      setQuestion('')

    } catch {
      setError('Could not reach the librarian. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-white/2 p-5 space-y-4">
      
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[var(--gold)]">✦</span>
          <p className="text-sm font-semibold text-[var(--text)]">Ask the Librarian</p>
          <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-dim)] px-2 py-0.5 text-xs text-[var(--gold)]">
            {LENS_LABELS[selectedLens]} lens
          </span>
        </div>
        <p className="text-xs text-[var(--muted)] leading-relaxed">
          The Librarian surfaces verified scholarship from classical scholars. 
          The reflection is yours to write.
        </p>
      </div>

      {/* Question input */}
      <div className="space-y-2">
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey && !loading) {
              e.preventDefault()
              handleAsk()
            }
          }}
          placeholder={LENS_PLACEHOLDERS[selectedLens] || "Ask anything about this verse..."}
          className="w-full rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-sm 
            placeholder:text-[var(--muted)] focus:border-white/20 focus:outline-none 
            resize-none min-h-[80px] text-[var(--text)]"
          disabled={loading}
        />
        
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--muted)]">
            Or leave blank to get a general study guide for this lens
          </p>
          <button
            onClick={handleAsk}
            disabled={loading}
            className="rounded-xl border border-[var(--gold-border)] bg-[var(--gold-dim)] 
              px-4 py-2 text-sm text-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--ink)] 
              transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                Searching sources...
              </span>
            ) : (
              'Search the Sources'
            )}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-sm text-red-300/80">{error}</p>
        </div>
      )}

      {/* Response */}
      {response && (
        <div className="rounded-xl border border-[var(--gold-border)] bg-gradient-to-br 
          from-[var(--gold-dim)] to-transparent p-4 space-y-3">
          
          <p className="text-xs font-semibold tracking-widest uppercase text-[var(--gold)]">
            From the Scholars
          </p>
          
          <p className="text-sm leading-7 text-[var(--text)]">
            {response}
          </p>
          
          {sources && (
            <div className="border-t border-white/8 pt-3">
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                ✦ {sources}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Encouragement after first use */}
      {hasAsked && !loading && (
        <p className="text-xs text-[var(--muted)] italic">
          Now use what you found to write your own reflection below ↓
        </p>
      )}
    </div>
  )
}
```

---

## 9. HOW TO WIRE IT INTO THE CIRCLE PAGE

In `src/app/(app)/circle/page.tsx`, find the 5 Lenses section and add `StudyLibrarian` directly after it:

```typescript
// Add this import at the top
import StudyLibrarian from '@/components/study/StudyLibrarian'

// Add this after the lenses section, before the reflection composer:
{verse && (
  <StudyLibrarian
    verseKey={verseKey}
    selectedLens={selectedLens}
    arabicText={verse.text_uthmani}
    translationText={activeTranslation?.text ?? ''}
  />
)}
```

That's it. It's completely self-contained — it doesn't touch any other part of the codebase.

---

## 10. DESIGN RULES — MATCH THE EXISTING APP

The app has a dark Islamic aesthetic. Your component must match:

```css
Colors:
--ink: #0F0E0C          (main background)
--gold: #C9A84C         (accent — use sparingly)
--gold-dim: rgba gold with low opacity (subtle backgrounds)
--gold-border: rgba gold with medium opacity (borders)
--text: #F5F0E8         (primary text)
--muted: #8A8278        (secondary text)

Border radius: rounded-2xl for cards, rounded-xl for inputs/buttons
Font: system font for UI, Amiri for Arabic text
Spacing: generous — this app breathes
```

Do NOT:
- Use purple or blue
- Use bright colors anywhere
- Add animations beyond subtle fades
- Add emoji or decorative icons (except ✦ which is already used)

---

## 11. TESTING YOUR FEATURE

Before calling it done, test these scenarios:

**Test 1 — Vocabulary lens, specific question:**
Verse: `1:6` (Al-Fatihah)
Lens: vocabulary
Question: "What does 'sirat' mean and why is it used here?"
Expected: Word morphology + tafsir on the word choice

**Test 2 — Context lens, no question:**
Verse: `2:255` (Ayat Al-Kursi)
Lens: context
Question: (leave blank)
Expected: General historical context and asbab al-nuzul

**Test 3 — Relevance lens:**
Verse: `94:5` (Al-Inshirah)
Lens: relevance
Question: "How did scholars apply this verse to times of difficulty?"
Expected: Practical tafsir commentary

**Test 4 — Empty/edge cases:**
- No question entered — should still work
- Very long question — should handle gracefully
- API timeout — should show error message, not crash

---

## 12. WHAT SUCCESS LOOKS LIKE

The feature is done when:

- [ ] User can ask a question from any lens
- [ ] Response is grounded in verified tafsir (check for "Grounded in quran.ai" citation)
- [ ] Response is lens-appropriate (vocabulary gets word analysis, context gets history)
- [ ] Loading state displays correctly
- [ ] Error state displays if API fails
- [ ] Component matches the app's visual design
- [ ] Encouragement message appears after first use
- [ ] Does NOT write reflections for the user
- [ ] Does NOT give spiritual advice or personal opinions

---

## 13. FILES YOU CREATE

```
src/app/api/study/route.ts          ← API route (server-side)
src/components/study/StudyLibrarian.tsx  ← UI component (client-side)
```

**Files you DO NOT touch:**
```
src/lib/auth.ts                     ← Don't touch (working auth)
src/lib/qf-api.ts                   ← Don't touch (working APIs)
src/app/(app)/circle/page.tsx       ← Only add the import + component, nothing else
src/app/api/auth/*                  ← Never touch
```

---

## 14. GETTING HELP

**For API/Quran content questions:**
Docs: `https://api-docs.quran.foundation/docs/category/user-related-apis-pre-live`
MCP docs: `https://mcp.quran.ai/`
Email: `hackathon@quran.com` (they respond fast)

**For codebase questions:**
Ask Asma. She knows every file.

**For AI/Anthropic questions:**
Docs: `https://docs.anthropic.com`
MCP integration: `https://docs.anthropic.com/en/docs/agents-and-tools/mcp`

---

## 15. WHAT THIS FEATURE MEANS FOR THE HACKATHON

The judges are from Quran Foundation. They built Quran MCP. Seeing it integrated properly — with grounding, citations, and theological integrity — will make them stop and look twice.

Every other AI Quran app hallucinates Islamic content. Al-Habl's Librarian fetches verified scholarship and says "here is what the scholars said." That distinction matters enormously to this specific judging panel.

Your work on this feature could be the difference between placing and winning.

---

*Last updated: April 2026*
*Built for the Quran Foundation Hackathon — Deadline May 20, 2026*