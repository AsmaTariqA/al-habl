"use client"

let cachedToken: string | null = null
let tokenExpiresAt: number = 0

function getUserIdFromCookie(): string | null {
  // qf_user_id is set as httpOnly so JS can't read it directly.
  // We need a readable cookie. See callback fix below.
  if (typeof document === "undefined") return null
  const match = document.cookie
    .match(/(?:^|;\s*)qf_user_id_pub=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

export async function getClientAccessToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken
  }

  const userId = getUserIdFromCookie()
  if (!userId) return null

  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })

  if (!res.ok) return null

  const { access_token, expiresIn } = await res.json()
  if (!access_token) return null

  cachedToken = access_token
  tokenExpiresAt = Date.now() + (expiresIn ?? 3600) * 1000
  return cachedToken
}

export function clearCachedToken() {
  cachedToken = null
  tokenExpiresAt = 0
}