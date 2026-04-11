"use client"

import { supabase } from "@/lib/supabase"
import { session } from "@/lib/session"

// src/lib/client-access.ts
export async function getClientAccessToken(): Promise<string | null> {
  const userId = localStorage.getItem('qf_user_id')
  if (!userId) return null

  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })

  if (!res.ok) {
    // Token completely expired — redirect to login
    localStorage.clear()
    window.location.href = '/auth/login'
    return null
  }

  const { accessToken } = await res.json()
  return accessToken
}
