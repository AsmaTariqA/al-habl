"use client"

let cachedToken: string | null = null
let tokenExpiresAt: number = 0

export async function getClientAccessToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken
  }

  const userId = localStorage.getItem('qf_user_id')
  if (!userId) return null  // ← return null, don't redirect

  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })

  if (!res.ok) {
    // Don't clear localStorage here — just return null
    // Let the page decide what to do
    return null
  }

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