
WHO I AM
I am a solo developer building a web app called Al-Habl for the Quran Foundation Hackathon.

Deadline: April 20, 2026
Stack: Next.js 15 (App Router), TypeScript, Tailwind CSS
Hosting: Vercel
Auth: Quran Foundation OAuth2 (PKCE + confidential client)
Database: Supabase (token storage + minimal caching only)
UI scaffolding: Lovable / Copilot / Claude
I use vibe coding. I need working, production-grade code — not tutorials.


WHAT AL-HABL IS
Al-Habl (The Rope) is inspired by Surah Al-Imran 3:103:

"Hold firmly to the rope of Allah, all together."

It is a structured daily Quran study circle — not a reader, not a chatbot, not a content library.
Core loop:

User joins a circle of 4–5 real humans
Every day, one ayah drops into the circle (from Quran Foundation API)
Members study it through the 5 Lenses Framework
Members post their reflections inside the circle
All Quran resources (tafsir, translation, audio, word-by-word) surface inline
Streaks and activity goals keep the circle accountable

What it is NOT:

Not another Quran reader
Not an AI chatbot
Not a social media feed
Not solo — it is built entirely around human accountability


THE 5 LENSES FRAMEWORK
This is the intellectual core of the app. Every daily ayah is studied through these 5 lenses:
jsexport const prompts = {
  vocabulary: [
    "Which word in this verse stands out most to you? Why?",
    "What deeper meanings could this word have?",
    "Is there a reason Allah used *this* word instead of another?"
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
    "How would this verse feel if it were addressing *you* personally?"
  ],
  relevance: [
    "How is this verse relevant to something you're going through?",
    "What emotions or thoughts does this verse trigger today?",
    "What change can you make in your life after reading this?"
  ]
};
Each member picks ONE lens per day and posts a reflection based on it.

FOLDER STRUCTURE
al-habl/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # Login page with QF OAuth button
│   │   │   └── layout.tsx
│   │   ├── (app)/
│   │   │   ├── circle/
│   │   │   │   ├── page.tsx          # Main circle view (today's ayah + reflections)
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Specific circle view
│   │   │   ├── profile/
│   │   │   │   └── page.tsx          # User profile, streaks, activity
│   │   │   ├── onboarding/
│   │   │   │   └── page.tsx          # First-time user: create or join circle
│   │   │   └── layout.tsx            # App shell with nav
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── callback/
│   │   │   │   │   └── route.ts      # OAuth callback handler (exchanges code for tokens)
│   │   │   │   ├── refresh/
│   │   │   │   │   └── route.ts      # Silent token refresh
│   │   │   │   └── logout/
│   │   │   │       └── route.ts      # Logout + session clear
│   │   │   ├── circle/
│   │   │   │   ├── route.ts          # GET all circles, POST create circle
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts      # GET specific circle data
│   │   │   ├── ayah/
│   │   │   │   └── today/
│   │   │   │       └── route.ts      # GET today's ayah (cached in Supabase)
│   │   │   └── user/
│   │   │       └── route.ts          # GET current user profile
│   │   ├── globals.css
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Landing page
│   ├── components/
│   │   ├── ui/                       # shadcn-style base components
│   │   ├── ayah/
│   │   │   ├── AyahCard.tsx          # Displays the daily ayah beautifully
│   │   │   ├── AyahResources.tsx     # Tafsir, translations, audio inline
│   │   │   └── LensSelector.tsx      # 5 Lenses tab selector
│   │   ├── circle/
│   │   │   ├── CircleHeader.tsx      # Circle name, members, streak
│   │   │   ├── ReflectionFeed.tsx    # List of member reflections
│   │   │   ├── ReflectionCard.tsx    # Single reflection with lens tag
│   │   │   └── ReflectionComposer.tsx # Write + post a reflection
│   │   ├── onboarding/
│   │   │   ├── CreateCircle.tsx
│   │   │   └── JoinCircle.tsx
│   │   └── layout/
│   │       ├── Navbar.tsx
│   │       └── BottomNav.tsx         # Mobile nav
│   ├── lib/
│   │   ├── auth.ts                   # OAuth helpers, token management
│   │   ├── qf-api.ts                 # All Quran Foundation API calls
│   │   ├── supabase.ts               # Supabase client
│   │   ├── ayah-rotation.ts          # Daily ayah selection logic
│   │   ├── lenses.ts                 # 5 Lenses prompts + rotation
│   │   └── utils.ts                  # General helpers
│   ├── hooks/
│   │   ├── useAuth.ts                # Auth state hook
│   │   ├── useCircle.ts              # Circle data hook
│   │   ├── useAyah.ts                # Today's ayah hook
│   │   └── useStreak.ts              # Streak data hook
│   └── types/
│       ├── auth.ts                   # Auth types
│       ├── circle.ts                 # Circle + member types
│       ├── ayah.ts                   # Ayah + tafsir types
│       └── user.ts                   # User profile types
├── .env.local                        # Environment variables (never commit)
├── .env.example                      # Safe template to commit
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json

ENVIRONMENT VARIABLES
bash# .env.local — NEVER commit this file

# Pre-Production (use during ALL development)
NEXT_PUBLIC_QF_CLIENT_ID=1f7948e1-1ff6-405b-b72f-c305d083ca00
QF_CLIENT_SECRET=RV2OxRrsk~P2Bqfy9.l7-.TBDS
NEXT_PUBLIC_QF_AUTH_URL=https://prelive-oauth2.quran.foundation
NEXT_PUBLIC_QF_API_URL=https://apis-prelive.quran.foundation
NEXT_PUBLIC_QF_REDIRECT_URI=http://localhost:3000/auth/callback

# Production (switch only during submission week)
# NEXT_PUBLIC_QF_CLIENT_ID=416d6683-0b5d-4273-89d4-4e5dda796d39
# QF_CLIENT_SECRET=UsTU_5BkvFzr1bVr.oWRfxPaxW
# NEXT_PUBLIC_QF_AUTH_URL=https://oauth2.quran.foundation
# NEXT_PUBLIC_QF_API_URL=https://apis.quran.foundation
# NEXT_PUBLIC_QF_REDIRECT_URI=https://al-habl.vercel.app/auth/callback

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

QURAN FOUNDATION API — KEY DETAILS
Base URL (pre-prod): https://apis-prelive.quran.foundation
Base URL (prod): https://apis.quran.foundation
Auth headers on every API call:
tsheaders: {
  'x-auth-token': accessToken,        // user's OAuth access token
  'x-client-id': process.env.NEXT_PUBLIC_QF_CLIENT_ID,
  'Content-Type': 'application/json'
}
OAuth2 endpoints (pre-prod):
Authorization: https://prelive-oauth2.quran.foundation/oauth2/authorize
Token:         https://prelive-oauth2.quran.foundation/oauth2/token
UserInfo:      https://prelive-oauth2.quran.foundation/oauth2/userinfo
Logout:        https://prelive-oauth2.quran.foundation/oidc/logout
OAuth2 flow: Authorization Code + PKCE (confidential client)

Token exchange MUST happen server-side (in /api/auth/callback/route.ts)
Client secret NEVER goes to the browser
Required scopes: openid profile email offline_access

APIs we use:
FeatureEndpointDaily ayahGET /v4/verses/random or by keyTafsirGET /v4/tafsirs/{tafsir_id}/verses/{verse_key}TranslationsGET /v4/verses/by_key/{verse_key}?translations=131AudioGET /v4/recitations/{recitation_id}/by_ayah/{verse_key}Word by wordGET /v4/verses/by_key/{verse_key}?words=trueCreate roomPOST /api/v1/community/roomsGet roomGET /api/v1/community/rooms/{room_id}Room membersGET /api/v1/community/rooms/{room_id}/membersInvite to roomPOST /api/v1/community/rooms/{room_id}/inviteRoom postsGET /api/v1/community/rooms/{room_id}/postsCreate postPOST /api/v1/community/postsStreaksGET /api/v1/community/users/me/streaksActivity daysGET /api/v1/community/users/me/activity-daysGoalsGET /api/v1/community/users/me/goalsBookmarksGET /api/v1/community/bookmarksCollectionsGET /api/v1/community/collectionsNotesGET /api/v1/community/notesUser profileGET /api/v1/community/users/me

SUPABASE SCHEMA (minimal)
sql-- Token storage (server-side only, never exposed to client)
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qf_user_id TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily ayah cache (avoid hitting API on every request)
CREATE TABLE daily_ayah_cache (
  date DATE PRIMARY KEY,
  verse_key TEXT NOT NULL,
  verse_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

BUILD RULES — READ BEFORE WRITING ANY CODE

Auth first. Nothing works without auth. Build /auth/callback/route.ts before any UI.
One feature at a time. Never ask AI to "build the whole app." Build one component, one API route, one page at a time.
Server-side secrets. QF_CLIENT_SECRET and SUPABASE_SERVICE_ROLE_KEY only in API routes. Never in components.
Pre-prod only during development. Never switch to production credentials until submission week.
No real-time. Use async/polling, not WebSockets. Simpler, more stable, good enough.
Scope creep is death. If a feature isn't in this document, it doesn't get built before April 20th.
Test with real people on Day 8. Get 4–5 humans in a circle before demo day.
Demo video is built, not recorded. Plan the happy path from Day 1.


DESIGN DIRECTION

Aesthetic: Refined Islamic minimalism. Deep ink tones, warm parchment accents, geometric motifs inspired by Islamic art.
Typography: Arabic text must render beautifully. Use font-arabic class with proper RTL support.
Color palette:

Primary background: #0F0E0C (deep ink)
Surface: #1A1814 (warm dark)
Accent: #C9A84C (gold)
Text primary: #F5F0E8 (warm white)
Text secondary: #8A8278 (muted)


Mobile-first. Most users will view on phones.
No generic AI aesthetics. No purple gradients. No Inter font everywhere. No cookie-cutter cards.


JUDGING CRITERIA (what we're optimizing for)
CriterionPointsOur StrategyImpact on Quran Engagement30Lead every narrative with the human problemProduct Quality & UX20Beautiful design, mobile-first, no broken statesTechnical Execution20Working OAuth, stable APIs, no crashes on demoInnovation & Creativity155 Lenses framework is the differentiatorEffective Use of APIs1515+ APIs used, more than any other submission
Tiebreaker: Impact score wins.

CURRENT STATUS

 Next.js project created
 Quran Foundation credentials received (both environments)
 All scopes approved (OAuth + all User APIs)
 Callback URL registered
 Folder structure created
 Auth flow built
 Daily ayah API connected
 Circle (Rooms API) connected
 Reflections (Posts API) connected
 5 Lenses UI built
 User APIs (streaks, goals, activity) connected
 UI/UX polish
 Real user testing
 Demo video recorded
 Submitted


HOW TO USE THIS FILE WITH AI TOOLS
With Claude / ChatGPT:
Paste this entire file at the start of every new conversation. Then say what you need:

"Using the context above, build /api/auth/callback/route.ts — the OAuth callback handler."

With Cursor / Copilot:
Add this file as AL-HABL-CONTEXT.md in your project root. In Cursor, add it to your context with @AL-HABL-CONTEXT.md in every prompt.
With Lovable:
Paste the folder structure + design direction sections when scaffolding UI. Do NOT give Lovable the OAuth section — it will hallucinate. Do OAuth manually with Claude.
Rule for every AI prompt:

Reference this file
State ONE specific thing you want built
Paste any relevant existing code
Specify what NOT to do


Last updated: April 6, 2026 — Day 1 of build