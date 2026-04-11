// src/app/api/content/chapters/route.ts
// Returns all chapters (surahs) using a client_credentials content token

import { NextResponse } from "next/server"

let cachedToken: { token: string; expiresAt: number } | null = null

async function getContentToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 30_000) return cachedToken.token

  const res = await fetch(`${process.env.NEXT_PUBLIC_QF_AUTH_URL}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_QF_CLIENT_ID}:${process.env.QF_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials", scope: "content" }).toString(),
  })

  if (!res.ok) throw new Error(`Content token failed: ${res.status}`)
  const data = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  return cachedToken.token
}

export async function GET() {
  const token = await getContentToken()
  const res = await fetch(`${process.env.NEXT_PUBLIC_QF_API_URL}/content/api/v4/chapters`, {
    headers: { "x-auth-token": token, "x-client-id": process.env.NEXT_PUBLIC_QF_CLIENT_ID! },
    next: { revalidate: 86400 },
  })
  const data = await res.json()
  return NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=86400" } })
}