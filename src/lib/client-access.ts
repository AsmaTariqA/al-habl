"use client"

let cachedToken: string | null = null
let tokenExpiresAt: number = 0

export async function getClientAccessToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken
  }

  // Don't send userId — the server reads qf_user_id httpOnly cookie directly
  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    credentials: 'include', // ensures cookies are sent
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