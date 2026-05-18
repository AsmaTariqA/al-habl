# AL-HABL — BUGS & FEATURES
### Asma's task list — fix in this order

---

## 🔴 CRITICAL BUGS
### Fix these first. They break the core experience.

---

### BUG 1 — Can't see which circle you're in
**What happens:** After login, user can't tell which circle they're in. Circle name/ID not displaying clearly.

**Where to look:**
- `src/app/(app)/circle/page.tsx` — CircleHeader section
- `src/lib/session.ts` — `getRoomId()` function
- `src/hooks/useCircle.ts` — `room` state

**What to fix:**
- Make sure `room.name` is displayed prominently at top of circle page
- If `room` is null after load, show "No circle found" with a button to join one
- Store and display the circle name, not just the ID

---

### BUG 2 — Posts disappear after a day
**What happens:** Reflections from yesterday are gone. Users lose their circle history.

**Where to look:**
- `src/hooks/useCircle.ts` — find `isTodaysPost` function

**What it currently does (wrong):**
```typescript
function isTodaysPost(post: Post) {
  return post.created_at.slice(0, 10) === getStudyDateKey()
}
// This filters to TODAY ONLY — everything older disappears
```

**What to fix:**
```typescript
// Option A — Show last 7 days
function isRecentPost(post: Post) {
  const postDate = new Date(post.created_at)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  return postDate >= sevenDaysAgo
}

// Option B — Show all posts, grouped by date (better UX)
// Remove the filter entirely and group posts by date in the UI
```

---

### BUG 3 — Member names not displaying in chat
**What happens:** Reflections show blank name or user ID instead of the actual username.

**Where to look:**
- `src/hooks/useCircle.ts` — `postReflection` function
- `src/lib/qf-api.ts` — `createPost` function
- `src/components/circle/ReflectionCard.tsx` — username display

**What to fix:**
- When posting a reflection, fetch `getUserProfile()` first to get the username
- Store username in the post at creation time
- In `postReflection`, make sure `profile?.username` is being passed correctly:

```typescript
const member = members.find((entry) => entry.user_id === userId)
const username = member?.username ?? profile?.username ?? "Anonymous"
```

- Make sure `getUserProfile` is being called on page load and the result stored

---

### BUG 4 — Joined date shows current day instead of actual join date
**What happens:** Every member shows "Joined today" regardless of when they actually joined.

**Where to look:**
- `src/lib/qf-api.ts` — `normalizeMember` function
- `src/components/circle/` — wherever `joined_at` is displayed

**What to fix:**
```typescript
// In normalizeMember, check what the API actually returns
// Log the raw member object to see what fields exist:
console.log('Raw member data:', source)

// The field might be called differently:
joined_at: readString(record.joined_at) 
  || readString(record.createdAt) 
  || readString(record.created_at)
  || readString(record.joinedAt)
```

---

### BUG 5 — Streaks and activity not working
**What happens:** Streak count stays at 0. Activity days not logging. Profile shows no history.

**Where to look:**
- `src/hooks/useCircle.ts` — `postReflection` function — check if `logActivityDay` is called
- `src/lib/qf-api.ts` — `getStreaks`, `logActivityDay` functions
- `src/app/(app)/circle/page.tsx` — streak display in sidebar

**What to fix:**

Step 1 — Make sure activity is logged when reflection is posted:
```typescript
// In postReflection, after successful post:
const created = await createPost(...)
if (created) {
  // Log activity day
  const token = await getClientAccessToken()
  if (token) {
    await logActivityDay(token, new Date().toISOString().split('T')[0])
  }
}
```

Step 2 — Check the API endpoint is correct:
```typescript
// In qf-api.ts, logActivityDay should call:
POST https://apis-prelive.quran.foundation/quran-reflect/v1/users/me/activity-days
// Body: { date: "2026-04-21" }
```

Step 3 — Check streaks fetch on page load:
```typescript
// In circle page useEffect:
const streak = await getStreaks(token)
console.log('Streak data:', streak) // Add this to debug
```

---

## 🟡 MUST-HAVE FEATURES
### Add these after bugs are fixed.



---

### FEATURE 2 — See All Your Circles
**What it does:** User can see which circles they've created or joined.

**API call (already exists in qf-api.ts):**
```typescript
export async function getUserRooms(accessToken: string) {
  // Already implemented — calls /rooms/joined-rooms?limit=5
}
```

**Where to add UI:**
- Profile page — new section "My Circles"
- Show: circle name, member count, invite code, "Switch to this circle" button

---


### FEATURE 4 — Profile Page with Circle Info
**What it does:** Profile page shows everything about the user's Quran journey.

**Sections to add:**

```
Profile Page Layout:
├── User info (name, avatar from QF User API)
├── Current Circle
│   ├── Circle name
│   ├── Members list with participation status
│   ├── Invite code (to share with friends)
│   ├── Leave Circle button
│   └── Join Another Circle button
├── Stats
│   ├── Current streak (from Streaks API)
│   ├── Longest streak
│   └── Total reflections posted
├── Activity Heatmap (stretch goal)
│   └── GitHub-style calendar using Activity Days API
├── Bookmarked Ayahs
│   └── List from Bookmarks API
└── My Goals
    └── Weekly goal progress from Goals API
```

---

### FEATURE 5 — Onboarding Shows Existing Circles
**What it does:** When user lands on onboarding, if they already have circles they can pick one instead of creating new.

**Flow:**
```
/onboarding loads
→ Fetch getUserRooms()
→ If user has existing circles: show them with "Rejoin" option
→ If no circles: show "Create" and "Join with code" options
```

---

## ✅ WHAT IS ALREADY WORKING
### Don't touch these — they're working.

- OAuth2 login with Quran Foundation
- Circle creation via Rooms API
- Circle joining via invite code
- Daily ayah fetching with Arabic text
- Translation display
- Tafsir panel (expandable)
- Word-by-word breakdown
- Audio playback
- 5 Lenses UI tabs
- Reflection posting
- Comments on reflections
- Bookmarks API
- Collections API
- Notes API (private notes per ayah)
- Basic profile display

---

## 📋 BUILD ORDER

```


---


---

*Last updated: April 2026*
*Submission deadline: May 20, 2026 (submit by May 10 before exams)*
