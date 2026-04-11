# 🕌 QURAN CIRCLE — COMPLETE BUILD GUIDE

## Next.js 15 + Quran Foundation APIs + Supabase — Hackathon MVP

> **Deadline:** April 20, 2026
> **Difficulty:** Intermediate
> **Time to Complete:** 10 days (2 hours/day)
> **Project Type:** Daily Quran Study Circle with 5 Lenses Framework

---

## 📋 A. PROJECT OVERVIEW

### **Project Name:** Quran Circle

## Structured Daily Quran Study — Together

**Description:** A small, intimate Quran study circle that finds you. Every day, one ayah drops into your circle of 4–5 real humans. Members study it through the **5 Lenses Framework** — a structured reflection methodology covering Vocabulary, Structure, Context, Audience, and Relevance. All Quran resources (tafsir, translation, word-by-word, audio) surface automatically inline. Built entirely on top of Quran Foundation's API ecosystem.

### **Core Features:**

1. ✅ Quran Foundation OAuth2 login (use your existing Quran.com account)
2. ✅ Create or join a Circle (powered by Rooms API)
3. ✅ Daily ayah drops automatically — same for all circles worldwide
4. ✅ 5 Lenses Framework — structured reflection prompts per day
5. ✅ Full Quran resources inline — tafsir, translations, word-by-word, audio
6. ✅ Circle discussion — post reflections, reply to members
7. ✅ Streak tracking + activity days + goals
8. ✅ Private notes per ayah
9. ✅ Bookmarks + collections
10. ✅ Member profiles + participation tracking

### **User Stories:**

- As a user, I can log in with my Quran.com account
- As a user, I can create a Circle and invite friends via code
- As a user, I can see today's ayah with full Arabic, translation, and audio
- As a user, I can study the ayah through 5 structured lenses
- As a user, I can post my reflection and see my circle members' reflections
- As a user, I can read multiple tafsirs inline without leaving the app
- As a user, I can track my daily streak and weekly goal
- As a user, I can write private notes on any ayah
- As a user, I can bookmark ayahs and organize them into collections

---

## 🎯 B. THE 5 LENSES FRAMEWORK

This is the intellectual engine of the app. Every member studies the daily ayah through one of 5 lenses. The featured lens rotates daily.

```javascript
export const LENS_PROMPTS = {
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

// Daily lens rotation — deterministic, no DB needed
const LENSES = ['vocabulary', 'structure', 'context', 'audience', 'relevance'];

export function getTodaysLens(): string {
  const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return LENSES[daysSinceEpoch % 5];
}

// Daily ayah — same for all circles worldwide
const LAUNCH_DATE = new Date('2026-04-06');
const TOTAL_AYAHS = 6236;

export function getTodaysAyahNumber(): number {
  const today = new Date();
  const daysSinceLaunch = Math.floor(
    (today.getTime() - LAUNCH_DATE.getTime()) / (1000 * 60 * 60 * 24)
  );
  return (daysSinceLaunch % TOTAL_AYAHS) + 1;
}
```

---

## 🛠️ C. TECH STACK

### **Frontend + API Layer:**

```
next==15.1.0
react==19.0.0
typescript==5.7.0
tailwindcss==3.4.0
lucide-react==0.461.0
```

### **Auth & Data:**

```
@supabase/ssr==0.5.2          # Token storage only
@supabase/supabase-js==2.80.0
```

### **Quran Foundation APIs:**

```
Base URL (Content): https://api.qurancdn.com/api/qdc
Base URL (User):    https://api.quran.foundation/api/v4
Auth:               OAuth2 PKCE flow via accounts.quran.com
```

### **Tools:**

```
Lovable       — UI scaffolding and component generation
Claude        — API integration, logic, debugging
Vercel        — Deployment (free tier, zero config)
```

**Why this stack?**

- No custom backend needed — Quran Foundation IS the backend
- Supabase used only for secure OAuth token storage
- Next.js App Router handles server-side token refresh securely
- Lovable accelerates UI generation by 60-70%

---

## 📁 D. PROJECT STRUCTURE

```
quran-circle/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout + font loading
│   │   ├── page.tsx                    # Landing page
│   │   ├── globals.css                 # Global styles + Arabic font
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx            # OAuth login page
│   │   │   └── callback/
│   │   │       └── route.ts            # OAuth callback handler
│   │   ├── onboarding/
│   │   │   └── page.tsx                # First-time setup
│   │   ├── circle/
│   │   │   ├── page.tsx                # Main circle home
│   │   │   ├── archive/
│   │   │   │   └── page.tsx            # Past ayahs
│   │   │   └── members/
│   │   │       └── page.tsx            # Circle members
│   │   └── profile/
│   │       └── page.tsx                # User profile
│   │
│   ├── components/
│   │   ├── ui/                         # Base UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── accordion.tsx
│   │   ├── quran/                      # Quran-specific components
│   │   │   ├── ayah-card.tsx           # Arabic text + translation
│   │   │   ├── audio-player.tsx        # Recitation playback
│   │   │   ├── tafsir-panel.tsx        # Tafsir display + selector
│   │   │   ├── translation-panel.tsx   # Multiple translations
│   │   │   └── word-by-word.tsx        # Word breakdown table
│   │   ├── lenses/                     # 5 Lenses components
│   │   │   ├── lens-tabs.tsx           # Tab switcher
│   │   │   ├── lens-prompts.tsx        # Prompt display
│   │   │   └── reflection-form.tsx     # Submit reflection
│   │   ├── circle/                     # Circle components
│   │   │   ├── circle-header.tsx       # Circle name + members
│   │   │   ├── member-avatars.tsx      # Member status row
│   │   │   ├── discussion-feed.tsx     # Posts from Rooms API
│   │   │   ├── reflection-post.tsx     # Single post display
│   │   │   └── invite-modal.tsx        # Invite code modal
│   │   └── shared/
│   │       ├── navbar.tsx
│   │       └── streak-badge.tsx
│   │
│   ├── lib/
│   │   ├── quran-api/
│   │   │   ├── content.ts              # Verses, translations, tafsir
│   │   │   ├── audio.ts                # Audio endpoints
│   │   │   └── word-by-word.ts         # Word breakdown
│   │   ├── quran-user-api/
│   │   │   ├── rooms.ts                # Rooms (circles) CRUD
│   │   │   ├── posts.ts                # Reflections + comments
│   │   │   ├── streaks.ts              # Streak tracking
│   │   │   ├── activity.ts             # Activity days
│   │   │   ├── goals.ts                # Weekly goals
│   │   │   ├── bookmarks.ts            # Bookmarks
│   │   │   ├── notes.ts                # Private notes
│   │   │   ├── preferences.ts          # User preferences
│   │   │   └── users.ts                # User profiles
│   │   ├── auth/
│   │   │   ├── oauth.ts                # PKCE flow helpers
│   │   │   └── tokens.ts               # Token management
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser client
│   │   │   └── server.ts               # Server client
│   │   ├── lenses.ts                   # 5 Lenses config + rotation
│   │   └── ayah-schedule.ts            # Daily ayah logic
│   │
│   ├── hooks/
│   │   ├── use-auth.ts                 # Auth state
│   │   ├── use-circle.ts               # Circle data
│   │   ├── use-today.ts                # Today's ayah + lens
│   │   └── use-streaks.ts              # Streak data
│   │
│   └── types/
│       ├── quran.ts                    # Quran API types
│       ├── circle.ts                   # Circle/Room types
│       └── user.ts                     # User types
│
├── public/
│   └── fonts/                          # Amiri Arabic font files
├── .env.local.example
├── .gitignore
├── middleware.ts                        # Auth middleware
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── README.md
```

---

## 🗄️ E. SUPABASE SCHEMA

> **Minimal — only what Quran Foundation APIs don't cover**

```sql
-- OAuth token storage (secure server-side)
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quran_user_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ayah cache (avoid hammering content API)
CREATE TABLE ayah_cache (
  ayah_number INTEGER PRIMARY KEY,
  arabic_text TEXT NOT NULL,
  translation_en TEXT,
  translation_ur TEXT,
  audio_url TEXT,
  cached_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ayah_cache ENABLE ROW LEVEL SECURITY;

-- Users can only access their own session
CREATE POLICY "Users access own session"
ON user_sessions FOR ALL
USING (quran_user_id = current_user);

-- Ayah cache is public read
CREATE POLICY "Anyone can read ayah cache"
ON ayah_cache FOR SELECT
USING (true);
```

---

## 🔑 F. QURAN FOUNDATION API REFERENCE

### **OAuth2 PKCE Flow**

```typescript
// lib/auth/oauth.ts

const AUTH_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_QF_CLIENT_ID!,
  authorizationEndpoint: 'https://accounts.quran.com/oauth2/auth',
  tokenEndpoint: 'https://accounts.quran.com/oauth2/token',
  redirectUri: process.env.NEXT_PUBLIC_QF_REDIRECT_URI!,
  scopes: ['openid', 'profile', 'email', 'offline_access']
};

// Step 1: Generate PKCE challenge
export async function generatePKCE() {
  const codeVerifier = generateRandomString(64);
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const codeChallenge = btoa(
    String.fromCharCode(...new Uint8Array(digest))
  ).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  return { codeVerifier, codeChallenge };
}

// Step 2: Build authorization URL
export function getAuthorizationUrl(codeChallenge: string, state: string) {
  const params = new URLSearchParams({
    client_id: AUTH_CONFIG.clientId,
    redirect_uri: AUTH_CONFIG.redirectUri,
    response_type: 'code',
    scope: AUTH_CONFIG.scopes.join(' '),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state
  });
  return `${AUTH_CONFIG.authorizationEndpoint}?${params}`;
}

// Step 3: Exchange code for tokens
export async function exchangeCodeForTokens(code: string, codeVerifier: string) {
  const response = await fetch(AUTH_CONFIG.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: AUTH_CONFIG.clientId,
      redirect_uri: AUTH_CONFIG.redirectUri,
      code,
      code_verifier: codeVerifier
    })
  });
  return response.json();
}
```

---

### **Content API — Fetch Today's Ayah**

```typescript
// lib/quran-api/content.ts

const CONTENT_BASE = 'https://api.qurancdn.com/api/qdc';

export async function fetchVerse(verseKey: string, language = 'en') {
  const res = await fetch(
    `${CONTENT_BASE}/verses/by_key/${verseKey}?` +
    `language=${language}&` +
    `words=true&` +
    `translations=131&` +   // 131 = Saheeh International EN
    `tafsirs=169&` +         // 169 = Ibn Kathir
    `recitation=7`,          // 7 = Mishary Alafasy
    { next: { revalidate: 3600 } } // Cache 1 hour
  );
  return res.json();
}

export async function fetchTafsir(verseKey: string, tafsirId: number) {
  const res = await fetch(
    `${CONTENT_BASE}/tafsirs/${tafsirId}/by_ayah/${verseKey}`
  );
  return res.json();
}

export async function fetchTranslations(verseKey: string, translationIds: number[]) {
  const ids = translationIds.join(',');
  const res = await fetch(
    `${CONTENT_BASE}/verses/by_key/${verseKey}?translations=${ids}`
  );
  return res.json();
}

// Common translation IDs:
// 131 = Saheeh International (English)
// 234 = Mufti Taqi Usmani (Urdu)
// 203 = Dr. Mustafa Khattab (English, The Clear Quran)

// Common tafsir IDs:
// 169 = Tafsir Ibn Kathir (English)
// 164 = Tafsir al-Jalalayn
// 381 = Maariful Quran (Urdu)
```

---

### **User API — Rooms (Circles)**

```typescript
// lib/quran-user-api/rooms.ts

const USER_BASE = 'https://api.quran.foundation/api/v4';

function authHeaders(token: string) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// Create a new circle
export async function createCircle(token: string, name: string) {
  const res = await fetch(`${USER_BASE}/rooms/groups`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ name, type: 'private' })
  });
  return res.json();
}

// Get user's circles
export async function getMyCircles(token: string) {
  const res = await fetch(`${USER_BASE}/rooms`, {
    headers: authHeaders(token)
  });
  return res.json();
}

// Get circle members
export async function getCircleMembers(token: string, roomId: number) {
  const res = await fetch(`${USER_BASE}/rooms/${roomId}/members`, {
    headers: authHeaders(token)
  });
  return res.json();
}

// Invite member by username
export async function inviteToCircle(token: string, roomId: number, userId: string) {
  const res = await fetch(`${USER_BASE}/rooms/${roomId}/invite`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ userId })
  });
  return res.json();
}

// Get circle posts (discussions)
export async function getCirclePosts(token: string, roomId: number) {
  const res = await fetch(`${USER_BASE}/rooms/${roomId}/posts`, {
    headers: authHeaders(token)
  });
  return res.json();
}
```

---

### **User API — Posts (Reflections)**

```typescript
// lib/quran-user-api/posts.ts

export async function postReflection(
  token: string,
  roomId: number,
  body: {
    verseKey: string;
    lens: string;
    content: string;
  }
) {
  const res = await fetch(`${USER_BASE}/posts`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      roomId,
      body: body.content,
      verseKey: body.verseKey,
      tags: [body.lens]    // Tag reflection with the lens used
    })
  });
  return res.json();
}

export async function postComment(token: string, postId: string, content: string) {
  const res = await fetch(`${USER_BASE}/comments`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ postId, body: content })
  });
  return res.json();
}
```

---

### **User API — Streaks, Activity, Goals**

```typescript
// lib/quran-user-api/streaks.ts

export async function getStreaks(token: string) {
  const res = await fetch(`${USER_BASE}/streaks`, {
    headers: authHeaders(token)
  });
  return res.json();
}

export async function logActivityDay(token: string, date: string) {
  const res = await fetch(`${USER_BASE}/activity-days`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ date })
  });
  return res.json();
}

export async function setWeeklyGoal(token: string, daysPerWeek: number) {
  const res = await fetch(`${USER_BASE}/goals`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ type: 'days_per_week', value: daysPerWeek })
  });
  return res.json();
}

export async function addBookmark(token: string, verseKey: string) {
  const res = await fetch(`${USER_BASE}/bookmarks`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ verseKey })
  });
  return res.json();
}

export async function saveNote(token: string, verseKey: string, note: string) {
  const res = await fetch(`${USER_BASE}/notes`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ verseKey, body: note, isPrivate: true })
  });
  return res.json();
}
```

---

## 🎨 G. DESIGN SYSTEM

### **Colors:**

```css
/* globals.css */
:root {
  --bg-primary: #F9F6F0;       /* Warm off-white */
  --bg-secondary: #F0EBE3;     /* Slightly darker surface */
  --green-deep: #1B4332;       /* Primary — deep green */
  --green-mid: #40916C;        /* Secondary green */
  --gold: #D4A853;             /* Accent — lens highlights only */
  --text-primary: #1C1C1C;
  --text-muted: #6B6B6B;
  --border: #E8E0D5;
}

/* Arabic text */
@import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&display=swap');

.arabic-text {
  font-family: 'Amiri', serif;
  font-size: 32px;
  line-height: 2.2;
  direction: rtl;
  text-align: right;
  color: var(--text-primary);
}
```

### **Design Rules:**

- Generous white space — every screen breathes
- No notification badges, no like counts, no follower counts
- Lens colors: each lens gets a subtle color tag (vocabulary=blue, structure=purple, context=amber, audience=teal, relevance=green)
- Arabic text: minimum 32px, never less
- Transitions: 200ms ease — nothing bouncy

---

## 📖 H. STEP-BY-STEP BUILD GUIDE

### **DAY 1 — OAuth2 Auth (April 6)**

#### Purpose:
Get Quran Foundation OAuth working. Everything depends on this. Do not proceed until auth works.

#### Steps:

**1.1 — Register OAuth Client**
```
1. Email: hackathon@quran.com
2. Request OAuth2 client credentials
3. Specify redirect URI: http://localhost:3000/auth/callback
4. They will send you: CLIENT_ID and CLIENT_SECRET
```

**1.2 — Project Setup**
```bash
npx create-next-app@latest quran-circle --typescript --tailwind --app
cd quran-circle
npm install @supabase/ssr @supabase/supabase-js lucide-react
```

**1.3 — Environment Variables**
```bash
# .env.local
NEXT_PUBLIC_QF_CLIENT_ID=your_client_id
NEXT_PUBLIC_QF_REDIRECT_URI=http://localhost:3000/auth/callback
QF_CLIENT_SECRET=your_secret
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role
```

**1.4 — Build OAuth login page**
```typescript
// app/(auth)/login/page.tsx
'use client';
import { generatePKCE, getAuthorizationUrl } from '@/lib/auth/oauth';

export default function LoginPage() {
  async function handleLogin() {
    const { codeVerifier, codeChallenge } = await generatePKCE();
    const state = crypto.randomUUID();

    // Store verifier in sessionStorage temporarily
    sessionStorage.setItem('pkce_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);

    const url = getAuthorizationUrl(codeChallenge, state);
    window.location.href = url;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F6F0]">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-medium text-[#1B4332]">Quran Circle</h1>
        <p className="text-[#6B6B6B]">One ayah. Five lenses. Every day.</p>
        <button
          onClick={handleLogin}
          className="bg-[#1B4332] text-white px-8 py-3 rounded-lg hover:bg-[#40916C] transition-colors"
        >
          Continue with Quran.com
        </button>
      </div>
    </div>
  );
}
```

**1.5 — Build OAuth callback handler**
```typescript
// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/auth/oauth';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) return NextResponse.redirect('/auth/login?error=no_code');

  // Exchange code for tokens
  const codeVerifier = request.cookies.get('pkce_verifier')?.value;
  const tokens = await exchangeCodeForTokens(code, codeVerifier!);

  // Store tokens in Supabase
  const supabase = createServerClient();
  await supabase.from('user_sessions').upsert({
    quran_user_id: tokens.sub,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: new Date(Date.now() + tokens.expires_in * 1000)
  });

  // Set session cookie
  const response = NextResponse.redirect('/circle');
  response.cookies.set('qf_user_id', tokens.sub, { httpOnly: true, secure: true });

  return response;
}
```

**✅ Checkpoint: Can log in with Quran.com account and land on /circle**

---

### **DAY 2 — Today's Ayah (April 7)**

#### Purpose:
Fetch and display today's ayah with Arabic text, translation, and audio.

```typescript
// app/circle/page.tsx (simplified)
import { getTodaysAyahNumber } from '@/lib/ayah-schedule';
import { fetchVerse } from '@/lib/quran-api/content';
import AyahCard from '@/components/quran/ayah-card';

export default async function CirclePage() {
  const ayahNumber = getTodaysAyahNumber();
  const verseData = await fetchVerse(ayahNumber.toString());

  return (
    <main>
      <AyahCard verse={verseData} />
    </main>
  );
}
```

```typescript
// components/quran/ayah-card.tsx
export default function AyahCard({ verse }: { verse: any }) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-[#E8E0D5]">
      <p className="text-sm text-[#6B6B6B] mb-4">
        {verse.chapter_name} • {verse.verse_key}
      </p>
      <p className="arabic-text mb-6">{verse.text_uthmani}</p>
      <p className="text-[#1C1C1C] leading-relaxed">{verse.translation}</p>
      <AudioPlayer audioUrl={verse.audio_url} />
    </div>
  );
}
```

**✅ Checkpoint: Today's ayah displays with Arabic text, translation, and play button**

---

### **DAY 3 — Circles via Rooms API (April 8)**

#### Purpose:
Create and join circles using Quran Foundation Rooms API.

```typescript
// app/onboarding/page.tsx — circle creation flow
'use client';
import { createCircle, inviteToCircle } from '@/lib/quran-user-api/rooms';
import { useState } from 'react';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [circleName, setCircleName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  async function handleCreateCircle() {
    const token = getAccessToken(); // from session
    const circle = await createCircle(token, circleName);
    setInviteCode(circle.inviteCode);
    setStep(3); // show invite code to share
  }

  // render steps...
}
```

**✅ Checkpoint: Can create a circle, get an invite code, share it, someone else joins**

---

### **DAY 4 — 5 Lenses UI (April 9)**

#### Purpose:
Build the lens selector and reflection prompt display.

```typescript
// components/lenses/lens-tabs.tsx
'use client';
import { LENS_PROMPTS, getTodaysLens } from '@/lib/lenses';
import { useState } from 'react';

const LENS_COLORS = {
  vocabulary: '#3B82F6',   // blue
  structure:  '#8B5CF6',   // purple
  context:    '#F59E0B',   // amber
  audience:   '#14B8A6',   // teal
  relevance:  '#22C55E',   // green
};

export default function LensTabs() {
  const todaysLens = getTodaysLens();
  const [activeLens, setActiveLens] = useState(todaysLens);
  const prompts = LENS_PROMPTS[activeLens];

  return (
    <div className="space-y-4">
      {/* Lens tabs */}
      <div className="flex gap-2 flex-wrap">
        {Object.keys(LENS_PROMPTS).map(lens => (
          <button
            key={lens}
            onClick={() => setActiveLens(lens)}
            className={`px-3 py-1.5 rounded-full text-sm capitalize
              ${activeLens === lens
                ? 'text-white'
                : 'bg-[#F0EBE3] text-[#6B6B6B]'}`}
            style={activeLens === lens
              ? { backgroundColor: LENS_COLORS[lens] }
              : {}}
          >
            {lens} {lens === todaysLens && '★'}
          </button>
        ))}
      </div>

      {/* Prompts */}
      <div className="space-y-3">
        {prompts.map((prompt, i) => (
          <p key={i} className="text-[#1C1C1C] leading-relaxed">
            {i + 1}. {prompt}
          </p>
        ))}
      </div>
    </div>
  );
}
```

**✅ Checkpoint: Lens tabs render, today's lens is highlighted, prompts display**

---

### **DAY 5 — Tafsir + Translations (April 10)**

#### Purpose:
Full Quran study resources inline — multiple tafsirs and translations.

```typescript
// components/quran/tafsir-panel.tsx
'use client';
import { fetchTafsir } from '@/lib/quran-api/content';
import { useState, useEffect } from 'react';

const TAFSIRS = [
  { id: 169, name: 'Ibn Kathir (English)' },
  { id: 164, name: 'Al-Jalalayn' },
  { id: 381, name: 'Maariful Quran (Urdu)' },
];

export default function TafsirPanel({ verseKey }: { verseKey: string }) {
  const [selectedTafsir, setSelectedTafsir] = useState(169);
  const [tafsirText, setTafsirText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchTafsir(verseKey, selectedTafsir)
      .then(data => setTafsirText(data.tafsir.text))
      .finally(() => setLoading(false));
  }, [verseKey, selectedTafsir]);

  return (
    <div className="space-y-4">
      <select
        value={selectedTafsir}
        onChange={e => setSelectedTafsir(Number(e.target.value))}
        className="border border-[#E8E0D5] rounded-lg px-3 py-2 text-sm"
      >
        {TAFSIRS.map(t => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      {loading
        ? <p className="text-[#6B6B6B]">Loading...</p>
        : <div className="prose max-w-none text-[#1C1C1C] leading-loose"
            dangerouslySetInnerHTML={{ __html: tafsirText }} />
      }
    </div>
  );
}
```

**✅ Checkpoint: Switch between tafsirs, text renders, no crashes**

---

### **DAY 6 — Discussion + Reflection Submission (April 11)**

#### Purpose:
Post reflections to Rooms API, display circle discussion.

```typescript
// components/circle/reflection-form.tsx
'use client';
import { postReflection } from '@/lib/quran-user-api/posts';
import { logActivityDay } from '@/lib/quran-user-api/activity';
import { getTodaysLens } from '@/lib/lenses';

export default function ReflectionForm({
  roomId, verseKey, onPost
}: {
  roomId: number;
  verseKey: string;
  onPost: () => void;
}) {
  const [content, setContent] = useState('');
  const [selectedLens, setSelectedLens] = useState(getTodaysLens());
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!content.trim()) return;
    setSubmitting(true);
    const token = getAccessToken();

    await postReflection(token, roomId, { verseKey, lens: selectedLens, content });
    await logActivityDay(token, new Date().toISOString().split('T')[0]);

    setContent('');
    onPost(); // refresh feed
    setSubmitting(false);
  }

  return (
    <div className="space-y-3 border-t border-[#E8E0D5] pt-4">
      <select value={selectedLens} onChange={e => setSelectedLens(e.target.value)}
        className="text-sm border border-[#E8E0D5] rounded-lg px-3 py-2">
        {['vocabulary','structure','context','audience','relevance'].map(l => (
          <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
        ))}
      </select>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Share your reflection..."
        className="w-full border border-[#E8E0D5] rounded-xl p-4 resize-none h-28 text-[#1C1C1C]"
      />
      <button
        onClick={handleSubmit}
        disabled={submitting || !content.trim()}
        className="bg-[#1B4332] text-white px-6 py-2.5 rounded-lg hover:bg-[#40916C] disabled:opacity-50"
      >
        {submitting ? 'Posting...' : 'Share Reflection'}
      </button>
    </div>
  );
}
```

**✅ Checkpoint: Post a reflection, see it appear in the feed, activity day logged**

---

### **DAY 7 — Streaks + Goals + Bookmarks (April 12)**

#### Purpose:
Wire remaining User APIs — the judge-scoring APIs.

```typescript
// hooks/use-streaks.ts
import { getStreaks } from '@/lib/quran-user-api/streaks';
import { useEffect, useState } from 'react';

export function useStreaks() {
  const [streak, setStreak] = useState<number>(0);
  const [longest, setLongest] = useState<number>(0);

  useEffect(() => {
    const token = getAccessToken();
    getStreaks(token).then(data => {
      setStreak(data.currentStreak);
      setLongest(data.longestStreak);
    });
  }, []);

  return { streak, longest };
}
```

**✅ Checkpoint: Streak displays on profile, bookmark button works, goal set on onboarding**

---

### **DAY 8 — UI Polish (April 13)**

#### Purpose:
This is 20 points. Don't skip it.

- Beautiful Arabic text rendering (Amiri font, 32px, RTL)
- Generous spacing throughout
- Lens color system working
- Member avatar row with participation status
- Mobile responsive (judges may check on phone)
- Loading states on every async operation
- Empty states for new circles with no posts yet

**✅ Checkpoint: Show the app to someone who doesn't know you built it. Do they understand what to do?**

---

### **DAY 9 — Real People + Demo Video (April 14-15)**

#### Purpose:
This is your most important asset. Judges watch the video first.

**Get real people in:**
- You + 3-4 friends/family
- All join the same circle
- All read today's ayah
- All post a reflection from different lenses
- Have a real conversation in the discussion

**Script your video (2-3 minutes):**
```
0:00 - 0:20  Problem: "Millions reconnect during Ramadan then lose it"
0:20 - 0:40  Show: Landing page, log in with Quran.com
0:40 - 1:00  Show: Today's ayah — Arabic, translation, audio
1:00 - 1:30  Show: 5 Lenses — pick Context, see prompts, write reflection
1:30 - 2:00  Show: Circle discussion — real people's reflections visible
2:00 - 2:20  Show: Tafsir panel — deep resources inline
2:20 - 2:40  Show: Streak tracking, profile, bookmarks
2:40 - 3:00  Close: "Quran Circle — one ayah, five lenses, every day"
```

**✅ Checkpoint: Video recorded, real conversation visible, 2-3 minutes**

---

### **DAY 10 — Submit (April 20)**

**Submission checklist:**

```
✅ Project title: Quran Circle
✅ Team: [Your name]
✅ Short description: (use the paragraph we wrote)
✅ Detailed explanation: (use requirements doc)
✅ Live demo: https://quran-circle.vercel.app
✅ GitHub: public repo with README
✅ Demo video: uploaded to YouTube or Loom (unlisted)
✅ API usage: list all APIs used (aim for 15+)
```

**API usage description to submit:**

```
Content APIs used:
- Verses API (daily ayah, Arabic text)
- Translations API (English, Urdu, multiple)
- Tafsir API (Ibn Kathir, Al-Jalalayn, Maariful Quran)
- Audio API (Mishary Alafasy recitation)
- Word-by-word API (morphology breakdown)

User APIs used:
- Rooms API (create circle, invite, join, get members, get posts)
- Posts API (post reflections with lens tags)
- Comments API (reply to reflections)
- Streaks API (daily streak tracking)
- Activity Days API (log participation)
- Goals API (weekly study goals)
- Bookmarks API (save ayahs)
- Notes API (private ayah notes)
- Preferences API (language, reciter settings)
- User Profile API (member display)
```

---

## 🏆 I. JUDGING SCORECARD

| Criterion | Points | Your Advantage |
|---|---|---|
| Impact (30pts) | 28–30 | Solves post-Ramadan drop-off. Structured daily habit. Human accountability. |
| Product Quality (20pts) | 17–20 | Intentional Islamic aesthetic. Beautiful Arabic. Clean UX. |
| Technical Execution (20pts) | 16–20 | Full OAuth2 PKCE. 15+ API integrations. Next.js App Router. |
| Innovation (15pts) | 13–15 | 5 Lenses Framework. Confirmed unique by Quran Foundation reviewer. |
| API Use (15pts) | 14–15 | 5 Content + 10 User APIs. Most competitors use 2-3. |
| **Total** | **88–100** | |

---

## ⚠️ J. WHAT WILL GO WRONG (AND HOW TO FIX IT)

**OAuth takes longer than expected**
→ Email hackathon@quran.com Day 1. They said they'll help with anything.

**Rooms API returns unexpected structure**
→ console.log every response. Build types from real responses, not docs alone.

**Arabic font doesn't render correctly**
→ Make sure you're using `direction: rtl` and the Amiri font is loaded before render.

**Circle is empty for the demo**
→ Recruit 4 people on Day 8. WhatsApp family. Reddit r/islam. Anyone.

**Lovable generates broken API calls**
→ Never let Lovable touch API integration. Use it for UI only. Bring API code to Claude.

**Running out of time**
→ Cut archive page and member search. Keep: ayah, lenses, discussion, streaks. Core only.

---

## 🔧 K. ENVIRONMENT VARIABLES

```bash
# .env.local

# Quran Foundation OAuth
NEXT_PUBLIC_QF_CLIENT_ID=
NEXT_PUBLIC_QF_REDIRECT_URI=http://localhost:3000/auth/callback
QF_CLIENT_SECRET=

# Quran Foundation APIs
NEXT_PUBLIC_QF_CONTENT_API=https://api.qurancdn.com/api/qdc
NEXT_PUBLIC_QF_USER_API=https://api.quran.foundation/api/v4

# Supabase (token storage only)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

*Built for the Quran Foundation Hackathon — Ramadan/Shawwal 1447*
*Deadline: April 20, 2026*
*Contact: hackathon@quran.com*
