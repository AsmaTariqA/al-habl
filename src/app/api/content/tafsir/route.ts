// src/app/api/content/tafsir/route.ts
// Handles tafsir fetch — server-side with content token

import { NextRequest, NextResponse } from "next/server"

let cachedToken: { token: string; expiresAt: number } | null = null

async function getContentToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 30_000) {
    return cachedToken.token
  }

  const authUrl = process.env.NEXT_PUBLIC_QF_AUTH_URL!
  const clientId = process.env.NEXT_PUBLIC_QF_CLIENT_ID!
  const clientSecret = process.env.QF_CLIENT_SECRET!

  const res = await fetch(`${authUrl}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "content",
    }).toString(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Content token request failed: ${res.status} ${err}`)
  }

  const data = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  return cachedToken.token
}

export async function GET(request: NextRequest) {
  const verseKey = request.nextUrl.searchParams.get("verseKey")
  const tafsirId = request.nextUrl.searchParams.get("tafsirId") ?? "169"

  if (!verseKey) {
    return NextResponse.json({ error: "Missing verseKey" }, { status: 400 })
  }

  const apiUrl = process.env.NEXT_PUBLIC_QF_API_URL!
  const clientId = process.env.NEXT_PUBLIC_QF_CLIENT_ID!

  let token: string
  try {
    token = await getContentToken()
  } catch (err) {
    console.error("[content/tafsir] Failed to get content token:", err)
    return NextResponse.json({ error: "Failed to authenticate with content API" }, { status: 500 })
  }

  const res = await fetch(
    `${apiUrl}/content/api/v4/tafsirs/${tafsirId}/verses/${verseKey}`,
    {
      headers: {
        "x-auth-token": token,
        "x-client-id": clientId,
      },
    },
  )

  if (!res.ok) {
    const err = await res.text()
    console.error(`[content/tafsir] QF API error: ${res.status} ${err}`)
    return NextResponse.json({ tafsir: null }, { status: 200 })
  }

  const data = await res.json()
  return NextResponse.json(
    { tafsir: data },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  )
}