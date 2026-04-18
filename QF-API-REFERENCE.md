# QF API Reference — AL-HABL
> For Claude Code use only. Do not guess endpoints. Every URL, method, and field is sourced directly from official QF docs.

---

## Base URLs

| Purpose | Base URL | Token Type |
|---|---|---|
| Content (verses, tafsir, audio) | `https://apis-prelive.quran.foundation/content/api/v4` | `client_credentials` — **server-side only** |
| Auth/User data (bookmarks, notes, streaks, goals, activity, collections) | `https://apis-prelive.quran.foundation/auth/v1` | User OAuth token |
| QuranReflect (rooms, posts, comments, user profile) | `https://apis-prelive.quran.foundation/quran-reflect/v1` | User OAuth token |
| OAuth server | `https://prelive-oauth2.quran.foundation` | — |

## Required Headers — Every User API Call
```
x-auth-token: <user_access_token>
x-client-id: 1f7948e1-1ff6-405b-b72f-c305d083ca00
```

---

## Collections `AUTH/v1`

### Create collection
```
POST /auth/v1/collections
Body: { "name": "string" }
```

### Get all collections
```
GET /auth/v1/collections
Query (all optional): sortBy, type, first (1-20), after, last (1-20), before
```

### Update collection
```
POST /auth/v1/collections/:collectionId
Body: { "name": "string" }
```

### Delete collection
```
DELETE /auth/v1/collections/:collectionId
```

### Add bookmark to collection
```
POST /auth/v1/collections/:collectionId/bookmarks
```

### Delete bookmark from collection
```
DELETE /auth/v1/collections/:collectionId/bookmarks/:bookmarkId
```

### Get collection items by ID
```
GET /auth/v1/collections/:collectionId
```

### Get all collection items
```
GET /auth/v1/collections/:collectionId/items
```

---

## Bookmarks `AUTH/v1`

### Add bookmark (ayah)
```
POST /auth/v1/bookmarks
Body:
{
  "key": 2,          // surah number
  "type": "ayah",
  "verseNumber": 3,  // ayah number
  "mushaf": 1        // 1=QCFV2 (standard). Options: 1,2,3,4,5,6,7,11,19
}
```
> Note: omit `isReading` for a regular bookmark. Set `isReading: true` for reading position bookmark.

### Get user bookmarks
```
GET /auth/v1/bookmarks?mushafId=1
```
> `mushafId` is REQUIRED — will 422 without it.

### Delete bookmark
```
DELETE /auth/v1/bookmarks/:bookmarkId
```

### Get bookmark by ID
```
GET /auth/v1/bookmarks/:bookmarkId
```

### Get bookmarks within ayah range
```
GET /auth/v1/bookmarks/within-range
```

### Get bookmark collections
```
GET /auth/v1/bookmarks/collections
```

---

## Activity Days `AUTH/v1`

### Get activity days
```
GET /auth/v1/activity-days
Query (all optional):
  from: "YYYY-MM-DD"
  to:   "YYYY-MM-DD"
  type: QURAN | LESSON | QURAN_READING_PROGRAM
  dateOrderBy: asc | desc
  first: 1-20    ← MAX IS 20, do NOT send first=30
  after, last, before (pagination cursors)
```

### Add/update activity day
```
POST /auth/v1/activity-days
```

### Estimate reading time
```
GET /auth/v1/activity-days/estimate-reading-time
```

---

## Goals `AUTH/v1`

### Get today's goal plan
```
GET /auth/v1/goals/get-todays-plan
Query (required): type=QURAN_TIME|QURAN_PAGES|QURAN_RANGE|COURSE|QURAN_READING_PROGRAM|RAMADAN_CHALLENGE
Header (optional): x-timezone
```

### Create goal
```
POST /auth/v1/goals
```

### Update goal
```
PATCH /auth/v1/goals/:goalId
```

### Delete goal
```
DELETE /auth/v1/goals/:goalId
```

### Generate timeline estimation
```
GET /auth/v1/goals/timeline-estimation
```

---

## Streaks `AUTH/v1`

### Get streaks (list)
```
GET /auth/v1/streaks
Query (all optional):
  type: QURAN
  status: ACTIVE | BROKEN
  from: "YYYY-MM-DD"
  to:   "YYYY-MM-DD"
  orderBy: startDate | days
  sortOrder: asc | desc
  first: 1-20, after, last, before
```
> Use `GET /auth/v1/streaks?first=1&status=ACTIVE&type=QURAN` to get current streak count.

### Get current streak days
```
GET /auth/v1/streaks/current-streak-days
Query (required): type=QURAN
Header (optional): x-timezone
```

---

## Notes `AUTH/v1`

### Get all notes
```
GET /auth/v1/notes
Query (optional): cursor, limit (1-50, default 20), sortBy (newest|oldest)
```
> ⚠️ Use `limit` NOT `first`. Sending `first` will 422.

### Add note
```
POST /auth/v1/notes
Body:
{
  "body": "text here",        // min 6 chars, max 10000
  "saveToQR": false,          // REQUIRED boolean
  "ranges": ["2:255-2:255"]   // format: "surah:verse-surah:verse"
  // attachedEntity: optional
}
```

### Update note
```
PATCH /auth/v1/notes/:noteId
Body: { "body": "updated text", "saveToQR": false }
```

### Delete note
```
DELETE /auth/v1/notes/:noteId
```

### Get note by ID
```
GET /auth/v1/notes/:noteId
```

### Get notes by verse
```
GET /auth/v1/notes/by-verse/:verseKey
```

### Get notes by verse range
```
GET /auth/v1/notes/by-verse-range
```

### Get notes count within range
```
GET /auth/v1/notes/count
```

### Publish note (to QR)
```
POST /auth/v1/notes/:noteId/publish
```

---

## User Profile `QR/v1`

### Get logged-in user profile
```
GET /quran-reflect/v1/users/profile
Query (optional): qdc=true (include Quran.com data)
```
> Returns: avatarUrls, username, id, firstName, lastName, postsCount, followersCount, bio, country, etc.
> ⚠️ This 404s on pre-prod if user not provisioned in QR system — handle gracefully.

### Edit user settings (language, reflection prefs)
```
PATCH /quran-reflect/v1/users/profile
Body (all optional):
{
  "languageId": 0,
  "reflectionLanguages": ["en"],
  "ayahLanguages": ["ar"],
  "customized": true,
  "hideFollowSuggestion": true,
  "showFollowFeaturedSuggestion": true
}
```

### Get logged-in user's rooms
```
GET /quran-reflect/v1/users/my-rooms
Query (optional): name (filter), page (default 1), limit (default 10)
```
> ⚠️ This is NOT `/rooms/joined-rooms`. The correct path is `/users/my-rooms`.

### Search users
```
GET /quran-reflect/v1/users/search
```

### Toggle follow/unfollow
```
POST /quran-reflect/v1/users/:userId/follow
```

### Get user profile by ID or username
```
GET /quran-reflect/v1/users/:idOrUsername
```

---

## Rooms `QR/v1`

### Create a circle (group)
```
POST /quran-reflect/v1/rooms/groups
Body:
{
  "name": "string",         // max 50 chars, required
  "description": "string",  // max 200 chars, optional
  "url": "string",          // max 50 chars, required (becomes subdomain)
  "public": false           // false = private circle
}
Response: 201 on success
```

### Get room by ID
```
GET /quran-reflect/v1/rooms/:id
Path: id = numeric room ID
```

### Get room members
```
GET /quran-reflect/v1/rooms/:id/members
Path: id = numeric room ID
Query (optional): limit (default 10), page (default 1)
```

### Get room posts
```
GET /quran-reflect/v1/rooms/:id/posts
Path: id = numeric room ID
```

### Get joined/managed rooms
```
GET /quran-reflect/v1/rooms/joined-rooms
Query: limit, page
```

### Search rooms
```
GET /quran-reflect/v1/rooms/search
```

### Invite users to room
```
POST /quran-reflect/v1/rooms/:id/invite
Body: { "userIds": ["string"], "emails": ["string"] }
```
> Only admins can invite. Sends notification/email with invite link.

### Accept room invite (by token in URL)
```
GET /quran-reflect/v1/rooms/:id/accept-invite?token=<invite_token>
```

### Accept room invite (by private token)
```
POST /quran-reflect/v1/rooms/accept-invite-by-token
```

### Reject room invite
```
POST /quran-reflect/v1/rooms/:id/reject-invite
```

### Join a public group
```
POST /quran-reflect/v1/rooms/:groupId/join
```
> Returns: `{ "joined": true }`

### Leave a group
```
POST /quran-reflect/v1/rooms/:groupId/leave
```

### Remove member from room
```
DELETE /quran-reflect/v1/rooms/:id/members/:userId
```

### Grant/revoke admin access
```
POST /quran-reflect/v1/rooms/admins-access
Body: { "roomId": 0, "userId": "string", "admin": true }
```

### Update group details
```
PATCH /quran-reflect/v1/rooms/groups/:id
```

### Update post privacy in room
```
PATCH /quran-reflect/v1/rooms/:id/post-privacy
```

---

## Posts `QR/v1`

### Create post (reflection)
```
POST /quran-reflect/v1/posts
Body:
{
  "post": {
    "body": "string",             // min 6 chars — REQUIRED
    "roomId": 1775938245894194,   // numeric — send as Number, parsed from String(roomId) to avoid precision loss
    "roomPostStatus": 0,          // 0=AsRoom, 1=Publicly, 2=OnlyMembers — FIELD NAME IS roomPostStatus not status
    "draft": false,               // REQUIRED
    "references": [               // REQUIRED array
      { "chapterId": 1, "from": 1, "to": 1 }
    ],
    "mentions": [],               // REQUIRED empty array if no mentions
    "tags": ["vocabulary"],       // lens name as tag
    "postAsAuthorId": "",         // REQUIRED (empty string if posting as self)
    "publishedAt": "2026-04-13T00:00:00.000Z"  // REQUIRED ISO string
  }
}
Response: 201 — { post: {...}, success: true }
```
> ⚠️ roomId is a 19-digit integer. JSON.stringify loses precision. Send as `String(roomId)` then parse with `BigInt` or send raw numeric. If API rejects number, try sending as string.

### Get posts feed
```
GET /quran-reflect/v1/posts
Query (optional): tab, page, limit, languages, authors, tags, references, groups
```

### Get post by ID
```
GET /quran-reflect/v1/posts/:id
```

### Edit post
```
PATCH /quran-reflect/v1/posts/:id
```

### Delete post
```
DELETE /quran-reflect/v1/posts/:id
```

### Toggle post like
```
POST /quran-reflect/v1/posts/:id/like
```

### Toggle post save
```
POST /quran-reflect/v1/posts/:id/save
```

### Get post liked state
```
GET /quran-reflect/v1/posts/:id/liked
```

### Track post view
```
POST /quran-reflect/v1/posts/:id/view
```

### Get posts by verse
```
GET /quran-reflect/v1/posts/by-verse/:verseKey
```

### Get current user posts
```
GET /quran-reflect/v1/posts/my-posts
```

### Export posts as PDF
```
POST /quran-reflect/v1/posts/export
```

---

## Comments `QR/v1`

### Create comment
```
POST /quran-reflect/v1/comments
Body: { "postId": 0, "body": "string" }
```

### Get post comments (paginated)
```
GET /quran-reflect/v1/posts/:id/comments
```

### Get all post comments
```
GET /quran-reflect/v1/posts/:id/comments/all
```

---

## Tags `QR/v1`

### Get tags
```
GET /quran-reflect/v1/tags
```

---

## Key Rules — Never Break These

1. **Content API** (verses, tafsir, audio) → server-side only via `/api/content/*` routes using `client_credentials` token. Never call from browser.

2. **User API** (bookmarks, notes, streaks, goals, activity, collections) → `AUTH/v1` base. Use user OAuth token.

3. **QuranReflect API** (rooms, posts, comments, user profile) → `QR/v1` base. Use user OAuth token.

4. **Notes**: use `limit=20` not `first=20`. `first` is rejected with 422.

5. **Activity days**: `first` max is 20. `first=30` will 422.

6. **Bookmarks GET**: always include `?mushafId=1`. Will 422 without it.

7. **Bookmarks POST**: body must include `mushaf: 1` (numeric). `type: "ayah"`, `key`: surah number, `verseNumber`: ayah number.

8. **Notes POST**: `saveToQR` is required boolean. `ranges` format: `"surah:verse-surah:verse"` e.g. `"2:255-2:255"`.

9. **Posts POST**: field is `roomPostStatus` (not `status`). `mentions: []` and `publishedAt` are required.

10. **User profile**: `GET /quran-reflect/v1/users/profile` — NOT `/auth/v1/users/me`. The `/users/me` path does not exist.

11. **User rooms**: `GET /quran-reflect/v1/users/my-rooms` — NOT `/rooms/joined-rooms`.

12. **All 403s on pre-prod** for streaks/goals/bookmarks/notes — pre-prod environment limitation. Wrap every call in `.catch(() => null)`. Never block UI on these.

---

## qf-api.ts Quick Reference

```ts
// BASE URL CONSTANTS
const USER_BASE = `${QF_API_URL}/auth/v1`
const QR_BASE   = `${QF_API_URL}/quran-reflect/v1`

// CORRECT function signatures
getBookmarks(token)          → GET USER_BASE/bookmarks?mushafId=1
bookmarkVerse(token, key)    → POST USER_BASE/bookmarks { key: surahNum, type:"ayah", verseNumber: ayahNum, mushaf:1 }
getNotes(token)              → GET USER_BASE/notes?limit=20
createNote(token, key, body) → POST USER_BASE/notes { body, saveToQR:false, ranges:["s:v-s:v"] }
getStreaks(token)             → GET USER_BASE/streaks?first=1&status=ACTIVE&type=QURAN
getActivityDays(token)       → GET USER_BASE/activity-days?first=20
getGoals(token)              → GET USER_BASE/goals/get-todays-plan?type=QURAN_TIME
getCollections(token)        → GET USER_BASE/collections
createCollection(token, n)   → POST USER_BASE/collections { name }
addToCollection(token, id, k)→ POST USER_BASE/collections/:id/bookmarks

getUserProfile(token)        → GET QR_BASE/users/profile
getUserRooms(token)          → GET QR_BASE/users/my-rooms
getRoom(token, id)           → GET QR_BASE/rooms/:id
getRoomMembers(token, id)    → GET QR_BASE/rooms/:id/members
getRoomPosts(token, id)      → GET QR_BASE/rooms/:id/posts
createPost(token, ...)       → POST QR_BASE/posts
likePost(token, id)          → POST QR_BASE/posts/:id/like
getComments(token, postId)   → GET QR_BASE/posts/:postId/comments
createComment(token, pid, b) → POST QR_BASE/comments { postId, body }
inviteToRoom(token, id, ...) → POST QR_BASE/rooms/:id/invite { userIds, emails }
joinRoom(token, groupId)     → POST QR_BASE/rooms/:groupId/join
```
GET /rooms/profile-by-url?url=:subdomain  →  getRoomBySubdomain()