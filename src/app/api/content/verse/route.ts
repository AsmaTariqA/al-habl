// src/app/api/content/verse/route.ts
// Handles: verse text, chapter info, audio — all in one call
// Uses client_credentials token (server-side only)

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
  if (!verseKey) {
    return NextResponse.json({ error: "Missing verseKey" }, { status: 400 })
  }

  const apiUrl = process.env.NEXT_PUBLIC_QF_API_URL!
  const clientId = process.env.NEXT_PUBLIC_QF_CLIENT_ID!

  let token: string
  try {
    token = await getContentToken()
  } catch (err) {
    console.error("[content/verse] Failed to get content token:", err)
    return NextResponse.json({ error: "Failed to authenticate with content API" }, { status: 500 })
  }

  const headers = {
    "x-auth-token": token,
    "x-client-id": clientId,
  }

  const chapterNumber = verseKey.split(":")[0]

  const [verseRes, chapterRes, audioRes] = await Promise.all([
    fetch(
      `${apiUrl}/content/api/v4/verses/by_key/${verseKey}?words=true&translations=131`,
      { headers },
    ),
    fetch(
      `${apiUrl}/content/api/v4/chapters/${chapterNumber}`,
      { headers },
    ),
    fetch(
      `${apiUrl}/content/api/v4/recitations/7/by_ayah/${verseKey}`,
      { headers },
    ),
  ])

  const [verseData, chapterData, audioData] = await Promise.all([
    verseRes.ok ? verseRes.json() : null,
    chapterRes.ok ? chapterRes.json() : null,
    audioRes.ok ? audioRes.json() : null,
  ])

  return NextResponse.json(
    {
      verse: verseData,
      chapter: chapterData,
      audio: audioData,
    },
    {
      headers: {
        // Cache for 1 hour on CDN, 24h stale-while-revalidate
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  )
}