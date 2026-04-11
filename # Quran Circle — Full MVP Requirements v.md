# Quran Circle — Full MVP Requirements v2
> For use with Lovable (lovable.dev) — Next.js full-stack app
> Updated with 5 Lenses framework + Quran Foundation Rooms/Posts API architecture

---

## What This App Is

**Quran Circle** is a structured, intimate daily Quran study experience. Users are placed into small circles of 4–5 real humans. Every day, one ayah drops into the circle. Each member studies it through the **5 Lenses Framework** — a structured reflection methodology — and shares their reflection with the group. All Quran resources (tafsir, translation, word-by-word, audio) are available inline. No hunting. No wandering. Just deep, guided, human study.

**What it is not:** A Quran reader. A social feed. An AI chatbot. A content library. A live session tool.

---

## The 5 Lenses Framework

This is the core intellectual engine of the app. Every ayah is studied through 5 lenses. Each day, one lens is the "featured lens" — users are prompted with one question from that lens. They can explore all 5 at any time.

```
VOCABULARY
- Which word in this verse stands out most to you? Why?
- What deeper meanings could this word have?
- Is there a reason Allah used this word instead of another?

STRUCTURE
- What's the order of ideas in this verse, and why might it matter?
- Does the sentence structure change the tone or emphasis?
- Is there repetition or symmetry that catches your attention?

CONTEXT
- What situation might this verse be responding to?
- Why do you think Allah revealed this message at that time?
- Does this connect to a historical event or broader theme?

AUDIENCE
- Who is Allah speaking to in this verse?
- What message is being sent to that audience?
- How would this verse feel if it were addressing you personally?

RELEVANCE
- How is this verse relevant to something you're going through?
- What emotions or thoughts does this verse trigger today?
- What change can you make in your life after reading this?
```

The featured lens rotates daily: Mon=Vocabulary, Tue=Structure, Wed=Context, Thu=Audience, Fri=Relevance, then repeats.

---

## Architecture — No Custom Backend Needed

**Authentication:** Quran Foundation OAuth2 (PKCE flow)
- Users log in with their existing Quran.com account
- No new signup friction — they're already in the ecosystem
- Access token used for all User API calls

**Circle Infrastructure:** Quran Foundation Rooms API
- Circles ARE Rooms — no custom database needed for groups
- Members ARE room members
- Discussions ARE room posts + comments

**Content:** Quran Foundation Content APIs
- Verses, translations, tafsir, audio — all from their API

**Minimal Custom Storage:** Only needed for:
- Daily ayah schedule logic (deterministic, no DB needed)
- 5 Lenses prompt rotation (static config)
- User lens preferences (localStorage or Quran Foundation Preferences API)

**Deployment:** Vercel (free tier)

---

## Quran Foundation APIs Used

### Content APIs (required — at least 1)
| API | How Used |
|-----|----------|
| Verses API | Fetch daily ayah (Arabic text) |
| Translations API | Show translation in user's preferred language |
| Tafsir API | Multiple tafsirs available inline (Ibn Kathir, Maariful Quran, etc.) |
| Audio API | Play recitation of the ayah (Mishary Alafasy default) |
| Word-by-word API | Word-by-word Arabic + transliteration + translation |

### User APIs (use as many as possible — judge's explicit tip)
| API | How Used |
|-----|----------|
| Rooms — Create group | Create a new circle |
| Rooms — Invite user | Invite members to circle via code |
| Rooms — Accept invite | Join a circle |
| Rooms — Get room members | Show who's in the circle |
| Rooms — Get room posts | Load circle discussion feed |
| Posts — Create post | Submit a reflection/comment |
| Comments — Create | Reply to someone's reflection |
| Streaks | Track daily participation streak |
| Activity Days | Log that user studied today |
| Goals | Set weekly reading/reflection goal |
| Bookmarks | Bookmark an ayah from the circle |
| Notes | Save private notes on an ayah |
| Preferences | Save language + reciter preferences |
| User Profile | Show member profiles in circle |
| Featured Users | Suggest scholars/members to follow on onboarding |

---

## Pages & Screens

### 1. Landing Page (`/`)
- App name: **Quran Circle**
- Tagline: *"One ayah. Five lenses. Every day."*
- 3 lines explaining what it is
- CTA: "Start Studying" → OAuth login with Quran Foundation
- Aesthetic: calm, deep green, minimal, spiritual — NOT a startup landing page

### 2. OAuth Login (`/auth`)
- "Continue with Quran.com" button
- Triggers Quran Foundation OAuth2 PKCE flow
- On success → redirect to `/onboarding` (first time) or `/circle` (returning)

### 3. Onboarding (`/onboarding`) — first time only
**Step 1 — Welcome**
- "Assalamu Alaikum, [name]"
- Brief explanation of how Quran Circle works

**Step 2 — Preferences**
- Preferred translation language (dropdown)
- Preferred reciter (dropdown — default: Mishary Alafasy)
- Save to Quran Foundation Preferences API

**Step 3 — Set a Goal**
- "How many days a week do you want to study?"
- Options: 3, 5, 7 days
- Save to Quran Foundation Goals API

**Step 4 — Join or Create Circle**
- Option A: Enter invite code → join existing circle (Rooms API: accept invite)
- Option B: Create new circle → name it → get shareable invite code
- Redirect to `/circle`

### 4. Circle Home (`/circle`) — MAIN SCREEN

**Section 1 — Today's Ayah**
- Surah name + ayah number (e.g. Al-Baqarah 2:255)
- Arabic text — large, beautiful, right-aligned (Amiri or Scheherazade font, min 32px)
- Translation in user's preferred language
- Below Arabic: word-by-word breakdown (tap any word to see its meaning)
- Audio player — play/pause recitation inline

**Section 2 — Study Resources (tabbed)**
Tab 1: Tafsir
- Dropdown to select tafsir (Ibn Kathir, Maariful Quran, Tafsir al-Jalalayn)
- Tafsir text renders below

Tab 2: Translations
- Show 3 translations side by side (English, Urdu, user's language)

Tab 3: Word by Word
- Full word-by-word breakdown table

**Section 3 — Today's Lens**
- Shows which lens is featured today (e.g. "Today's Lens: CONTEXT")
- Displays the 3 prompts for that lens
- User can switch to any other lens using tabs: Vocabulary / Structure / Context / Audience / Relevance
- Each lens shows its 3 reflection prompts

**Section 4 — Circle Discussion**
- Shows circle member avatars with participation status (green = participated today, gray = not yet)
- Each member's current streak shown below their avatar
- Discussion feed: posts from room members (Rooms — Get room posts API)
- Each post shows: member name, lens they used, their reflection text, time posted
- "Add your reflection" text area at bottom
  - User selects which lens they're reflecting from (dropdown)
  - Submit → POST to Quran Foundation Posts API + log Activity Day + update Streak

**Section 5 — Your Notes (private)**
- Private text area: "Add a personal note on this ayah"
- Saves to Quran Foundation Notes API
- Only visible to the user — not shared with circle

### 5. Ayah Archive (`/circle/archive`)
- Calendar view or list of past days
- Each day shows: ayah reference, which lens was featured, number of reflections
- Click any day → see full discussion that happened
- Users can still add reflections to past ayahs

### 6. Circle Members (`/circle/members`)
- List of all circle members
- Each member: avatar, name, streak, total reflections posted
- Streak leaderboard (friendly, not competitive)
- Button: "Invite someone" → copy invite code

### 7. Profile (`/profile`)
- User's name + avatar (from Quran Foundation User Profile API)
- Current streak + longest streak (Streaks API)
- Total reflections posted
- Weekly goal progress (Goals API)
- Activity heatmap — days studied (Activity Days API)
- Bookmarked ayahs (Bookmarks API)
- Saved notes (Notes API)
- Language + reciter preferences (editable)

---

## Daily Ayah Logic

Deterministic — no database needed:
```javascript
const TOTAL_AYAHS = 6236;
const START_DATE = new Date('2026-04-06'); // app launch date

function getTodaysAyah() {
  const today = new Date();
  const daysSinceLaunch = Math.floor((today - START_DATE) / (1000 * 60 * 60 * 24));
  const ayahNumber = (daysSinceLaunch % TOTAL_AYAHS) + 1;
  return ayahNumber; // fetch this verse from Quran Foundation API
}
```

All circles worldwide get the same ayah each day — creates a sense of global community.

---

## 5 Lenses Daily Rotation

```javascript
const LENSES = ['vocabulary', 'structure', 'context', 'audience', 'relevance'];

const LENS_PROMPTS = {
  vocabulary: [
    "Which word in this verse stands out most to you? Why?",
    "What deeper meanings could this word have?",
    "Is there a reason Allah used this word instead of another?"
  ],
  structure: [
    "What's the order of ideas in this verse, and why might it matter?",
    "Does the sentence structure change the tone or emphasis?",
    "Is there repetition or symmetry that catches your attention?"
  ],
  context: [
    "What situation might this verse be responding to?",
    "Why do you think Allah revealed this message at that time?",
    "Does this connect to a historical event or broader theme?"
  ],
  audience: [
    "Who is Allah speaking to in this verse?",
    "What message is being sent to that audience?",
    "How would this verse feel if it were addressing you personally?"
  ],
  relevance: [
    "How is this verse relevant to something you're going through?",
    "What emotions or thoughts does this verse trigger today?",
    "What change can you make in your life after reading this?"
  ]
};

function getTodaysLens() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
  return LENSES[dayOfWeek % 5];
}
```

---

## Design Guidelines

**Aesthetic:** A quiet library. A morning halaqah. Calm and intentional.

**Color Palette:**
- Background: `#F9F6F0` (warm off-white)
- Primary: `#1B4332` (deep green)
- Secondary: `#40916C` (medium green)
- Accent: `#D4A853` (warm gold — for lens highlights only)
- Text: `#1C1C1C`
- Muted text: `#6B6B6B`
- Borders: `#E8E0D5`

**Typography:**
- Arabic: Amiri font (Google Fonts) — min 32px, RTL, line-height 2.0
- UI: Inter — 16px body, generous line height
- Lens names: small caps or letter-spaced uppercase

**Spacing:** Generous. Every screen should feel like there's room to breathe and think.

**Motion:** Subtle only. A soft fade when the lens switches. Nothing bouncy.

**No:** Notification badges, like counts, follower counts, trending sections, infinite scroll, dark patterns.

**Yes:** White space, readable Arabic, calm transitions, private notes, human names not usernames.

---

## What NOT to Build in MVP

Save all of this for post-hackathon:
- Push/email notifications
- Matchmaking algorithm (manual join/create only)
- Multiple circles per user
- AI-generated reflections or summaries
- Live audio/video (that's Quran Space's job)
- Mobile app
- Public circles / discovery feed
- Monetization
- Admin dashboard
- Scholar verification badges

---

```

---

## Submission Alignment

| Hackathon Requirement | How Met |
|---|---|
| Content API | Verses + Translations + Tafsir + Audio + Word-by-word |
| User API | Rooms + Posts + Comments + Streaks + Activity Days + Goals + Bookmarks + Notes + Preferences + User Profile |
| Live demo | Vercel deployment |
| GitHub repo | Public repo with clean README |
| Demo video | Real circle, real 5 Lenses discussion, real humans |

| Judging Criterion | Score Target | Why |
|---|---|---|
| Impact (30pts) | 28–30 | Solves post-Ramadan drop-off with structured daily habit. The 5 Lenses framework turns passive reading into active study. |
| Product Quality (20pts) | 17–20 | Calm, intentional Islamic aesthetic. Beautiful Arabic rendering. Clean UX. |
| Technical Execution (20pts) | 16–20 | Next.js, Quran Foundation OAuth, full Rooms/Posts/User API integration. |
| Innovation (15pts) | 13–15 | 5 Lenses framework is original. No other app structures Quran study this way. Confirmed by Quran Foundation reviewer. |
| API Use (15pts) | 14–15 | 10+ User APIs + 5 Content APIs. Most competitors use 2–3. |

**Total target: 88–100 points.**