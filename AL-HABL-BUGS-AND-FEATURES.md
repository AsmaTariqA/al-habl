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

### FEATURE 1 — Leave Circle
**What it does:** User can leave their current circle to join a different one.

**API call (already exists in qf-api.ts):**
```typescript
export async function leaveRoom(accessToken: string, roomId: string) {
  // Already implemented — just needs UI
}
```

**Where to add UI:**
- Profile page or Circle settings
- A "Leave Circle" button with confirmation dialog
- After leaving: clear `session.getRoomId()`, redirect to `/onboarding`

**UI flow:**
```
Click "Leave Circle" 
→ Confirmation: "Are you sure? You'll need an invite code to rejoin."
→ Confirm → call leaveRoom() → clear session → redirect to /onboarding
```

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

### FEATURE 3 — Join a Different Circle
**What it does:** User can switch from their current circle to a new one.

**Flow:**
```
Profile page → "Join Another Circle" 
→ Enter invite code 
→ Call joinRoom() or acceptInviteByToken()
→ Update session.setRoomId() with new circle
→ Redirect to /circle
```

**Note:** User should be able to be in multiple circles eventually but for now — leave first, then join.

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
Week 1 (April 21-27):
Day 1  → BUG 2: Fix posts disappearing (most visible)
Day 2  → BUG 3: Fix member names in chat
Day 3  → BUG 1: Fix circle name display
Day 4  → BUG 5: Fix streaks and activity
Day 5  → BUG 4: Fix joined date

Week 2 (April 28 - May 4):
Day 1  → FEATURE 1: Leave circle button
Day 2  → FEATURE 2+3: See circles + join different circle
Day 3  → FEATURE 4: Profile page with circle info
Day 4  → FEATURE 5: Onboarding shows existing circles
Day 5  → Test everything with real people

Week 3 (May 5-10):
Day 1-2 → Polish UI, fix anything testers found
Day 3   → Demo video with real circle
Day 4   → Write submission documentation  
Day 5   → Submit before May 10th (before exams start)
```

---

## 🚫 OUT OF SCOPE
### Do NOT build these before May 10th.

- Push notifications
- Real-time chat (async is fine)
- Multiple circles simultaneously
- Circle discovery/search
- Admin controls
- Scholar verification
- Mobile app
- Any AI features (team member is handling that separately)

---

*Last updated: April 2026*
*Submission deadline: May 20, 2026 (submit by May 10 before exams)*
