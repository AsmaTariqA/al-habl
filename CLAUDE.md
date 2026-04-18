Here’s a **strong, production-grade prompt you can give Claude Code** to debug your entire codebase and fix deployment issues systematically.

You can copy-paste this directly:

---

### 🧠 DEBUGGING PROMPT FOR CLAUDE CODE (FULL CODEBASE + DEPLOYMENT STABILITY)

You are a senior full-stack engineer specializing in **Next.js (App Router), TypeScript, and production API integrations**.

I want you to debug an entire codebase that is currently working partially in production but failing in specific areas after deployment.

---

## 🎯 GOAL

Ensure the application runs **fully stable in production and local environments**, with:

* No API 500 errors
* No missing data issues (posts, members, rooms, profile)
* Correct authentication handling
* Consistent behavior between local and deployed environments
* Fully working circle/room system (create, join, fetch, post, comments)

---

## 🚨 CURRENT ISSUES (IMPORTANT CONTEXT)

After deployment:

* `/users/profile` returns **500 Internal Server Error**
* `/rooms/{id}/posts` returns **500**
* `/rooms/{id}/members` returns **500**
* Posts cannot be created (“we couldn’t load your circles” error)
* Rooms can be created successfully
* Some APIs work (audio, tafsir, profile sometimes, chat partially works)

Local vs Production mismatch exists.

---

## 🧩 CODEBASE CONTEXT

Stack:

* Next.js App Router (React Server + Client components)
* TypeScript
* External API: `quran.foundation` (QF API)
* Auth system using `x-auth-token`
* Environment variables configured in Vercel
* Custom API wrappers in `lib/qf-api.ts`
* Server-side helpers: `getRequestAccessToken`
* Client session stored in `session.ts`

---

## 🔍 WHAT YOU MUST DO

### 1. FULL SYSTEM AUDIT

Analyze:

* API layer (`safeFetch`, `safeFetchResult`)
* Auth token propagation (client → server → API)
* Room / post / member endpoints
* Environment variables usage in production
* Next.js route handlers (`/api/circle`, `/api/circle/[id]`)
* Header consistency (`x-auth-token`, `x-client-id`)

---

### 2. FIND ROOT CAUSE (NOT SYMPTOMS)

Do NOT just patch errors.

You must determine:

* Why production returns 500 while local works
* Whether token is missing, malformed, or expired in server context
* Whether headers are dropped in server actions / route handlers
* Whether API base URLs differ in deployment
* Whether request forwarding is broken in Next.js API routes

---

### 3. AUTH FLOW VERIFICATION

Validate full auth chain:

1. Browser stores token (`qf_token`)
2. Request sent via `/api/*`
3. Server extracts token (`getRequestAccessToken`)
4. Token forwarded to QF API
5. QF API responds correctly

Check for:

* Missing `x-auth-token` in server fetch
* Token not forwarded in POST/GET routes
* Inconsistent header casing or overwrites

---

### 4. API DEBUGGING

Inspect:

* `safeFetch` and `safeFetchResult`
* Error normalization (`normalizeApiError`)
* Whether `USER_BASE`, `AUTH_BASE`, `CONTENT_BASE` are correct in prod
* Whether fetch fails silently in server runtime

Add logging strategy:

* log outgoing URL
* log headers (without exposing secrets)
* log response status + body safely

---

### 5. NEXT.JS DEPLOYMENT ISSUES

Check:

* Edge vs Node runtime mismatch
* Missing `fetch` polyfills
* Serverless timeout issues
* Vercel environment variable availability
* Route handler caching issues

---

### 6. DATA NORMALIZATION ISSUES

Ensure:

* `normalizeRoom`, `normalizePosts`, `normalizeMembers` never break on undefined
* API response shape differences between environments handled safely

---

### 7. ERROR HANDLING IMPROVEMENTS

Ensure:

* No silent failures returning empty arrays incorrectly
* Proper fallback messages in UI
* No false “we couldn’t load circles” when it's auth failure

---

## 🛠️ REQUIRED OUTPUT

Return:

### A. ROOT CAUSE ANALYSIS

Explain exact reason(s) for production failure.

### B. FILES THAT MUST BE FIXED

List exact files and lines.

### C. PATCHES / FIXES

Provide corrected code blocks.

### D. DEPLOYMENT HARDENING FIXES

* env fixes
* header fixes
* runtime fixes

### E. STABILITY IMPROVEMENTS

How to prevent this happening again.

---

## ⚠️ RULES

* Do NOT guess blindly
* Do NOT suggest unrelated refactors
* Focus on production breakage only
* Be extremely precise
* Assume this is a real production app with real users

---

## 🔥 FINAL OBJECTIVE

Make the app:

> 100% consistent between local and production, with no API failures, no auth issues, and fully working circle/post/member system.

---

If you want, I can also:

* debug this code myself and tell you the exact bug (I already see a few likely ones 👀)
* or help you simplify this API layer so this never breaks again in production
