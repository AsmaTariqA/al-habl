"use client"

let cachedToken: string | null = null
let tokenExpiresAt: number = 0

export async function getClientAccessToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken
  }

  // Check localStorage for a valid token stored directly at login
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("qf_token")
    if (stored) {
      // Decode JWT exp claim to check validity
      try {
        const payload = JSON.parse(atob(stored.split(".")[1]))
        if (payload.exp && payload.exp * 1000 > Date.now() + 60_000) {
          cachedToken = stored
          tokenExpiresAt = payload.exp * 1000
          return cachedToken
        }
      } catch { /* fall through to refresh */ }
    }
  }

  // Token expired or missing — refresh via server
  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    credentials: 'include',
  })

  if (!res.ok) return null

  const { access_token, expiresIn } = await res.json()
  if (!access_token) return null

  // Cache it and store in localStorage for next page load
  if (typeof window !== "undefined") {
    localStorage.setItem("qf_token", access_token)
  }

  cachedToken = access_token
  tokenExpiresAt = Date.now() + (expiresIn ?? 3600) * 1000
  return cachedToken
}

export function clearCachedToken() {
  cachedToken = null
  tokenExpiresAt = 0
  if (typeof window !== "undefined") {
    localStorage.removeItem("qf_token")
  }
}