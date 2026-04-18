Here's a comprehensive prompt you can paste directly into Claude Code:

---

**Project: Al-Habl (Next.js app on Vercel)**
`https://al-habl.vercel.app`

**Stack:** Next.js 15 (App Router), Supabase, Quran Foundation OAuth2 API, TypeScript

---

**What we've debugged and confirmed:**

1. **Auth flow overview:**
   - User logs in via QF OAuth2 (PKCE flow)
   - `/api/auth/callback` exchanges code for tokens, stores them in Supabase `user_sessions` table, sets `qf_user_id` as httpOnly cookie
   - `getClientAccessToken()` in `lib/client-access.ts` calls `/api/auth/refresh` which reads the httpOnly cookie server-side, looks up Supabase, refreshes if expired, returns fresh token
   - All QF API calls in `lib/qf-api.ts` pass this token as `x-auth-token` header plus `x-client-id`

2. **Root cause found:** The QF OAuth server requires `client_secret_basic` authentication method — credentials must be sent as `Authorization: Basic base64(clientId:clientSecret)` header. Currently the code sends `client_id` and `client_secret` in the request body (`client_secret_post`), which the server rejects with `invalid_client` 401.

3. **This affects two places:**
   - `app/api/auth/refresh/route.ts` — token refresh call
   - `lib/auth.ts` — initial `exchangeCodeForToken` function (same bug, same fix needed)

4. **Secondary issue confirmed and fixed:** `getClientAccessToken()` was reading `localStorage.getItem('qf_user_id')` which is always null on prod because the callback sets an httpOnly cookie, not localStorage. This is already fixed — the refresh route now reads the cookie server-side and the client calls `/api/auth/refresh` with an empty body + `credentials: 'include'`.

---

**Exact fix needed:**

In every place that calls `POST /oauth2/token`, replace `client_secret_post` style:

```ts
// ❌ WRONG — body contains credentials
body: new URLSearchParams({
  grant_type: "refresh_token",
  refresh_token: session.refresh_token,
  client_id: process.env.NEXT_PUBLIC_QF_CLIENT_ID!,
  client_secret: process.env.QF_CLIENT_SECRET!,
})
```

With `client_secret_basic` style:

```ts
// ✅ CORRECT — credentials in Authorization header
const basicAuth = Buffer.from(
  `${process.env.NEXT_PUBLIC_QF_CLIENT_ID}:${process.env.QF_CLIENT_SECRET}`
).toString("base64")

// headers:
"Authorization": `Basic ${basicAuth}`,
"Content-Type": "application/x-www-form-urlencoded",

// body — no client_id or client_secret:
body: new URLSearchParams({
  grant_type: "refresh_token",
  refresh_token: session.refresh_token,
})
```

For the initial code exchange (`grant_type: authorization_code`), same pattern:

```ts
body: new URLSearchParams({
  grant_type: "authorization_code",
  code: code,
  redirect_uri: process.env.NEXT_PUBLIC_QF_REDIRECT_URI!,
  code_verifier: codeVerifier,
  // ← no client_id or client_secret in body
})
```

---
FIX the files that needs to be fixed

---

**Environment variables on Vercel (all confirmed present):**

```
NEXT_PUBLIC_QF_API_URL=https://apis.quran.foundation
NEXT_PUBLIC_QF_AUTH_URL=https://oauth2.quran.foundation
NEXT_PUBLIC_QF_CLIENT_ID=416d6683-0b5d-4273-89d4-4e5dda796d39
NEXT_PUBLIC_QF_REDIRECT_URI=https://al-habl.vercel.app/auth/callback
QF_CLIENT_SECRET=UsTU_5BkvFzr1bVr.oWRfxPaxW
NEXT_PUBLIC_SUPABASE_URL=https://sohlcesowlbxtuqgfwmu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

**After fixing, verify with:**

`GET https://al-habl.vercel.app/api/debug/force-refresh`

Expected result:
```json
{
  "refresh": "success",
  "profile_test": { "status": 200, "body": { ... } }
}
```

If `profile_test.status` is 200, everything is working. The rooms, posts, members, and profile endpoints will all start working immediately since the token flow is the only thing broken.


ENSURE reading .env.local for correct vars