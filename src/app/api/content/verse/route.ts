import { NextRequest, NextResponse } from "next/server"

let cachedToken: { token: string; expiresAt: number } | null = null

async function getContentToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 30_000) return cachedToken.token

  const authUrl = process.env.NEXT_PUBLIC_QF_AUTH_URL!
  const clientId = process.env.NEXT_PUBLIC_QF_CLIENT_ID!
  const clientSecret = process.env.QF_CLIENT_SECRET!

  const res = await fetch(`${authUrl}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials", scope: "content" }).toString(),
  })

  if (!res.ok) throw new Error(`Content token failed: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  return cachedToken.token
}

export async function GET(request: NextRequest) {
  const verseKey = request.nextUrl.searchParams.get("verseKey")
  if (!verseKey) return NextResponse.json({ error: "Missing verseKey" }, { status: 400 })

  const apiUrl = process.env.NEXT_PUBLIC_QF_API_URL!
  const clientId = process.env.NEXT_PUBLIC_QF_CLIENT_ID!

  let token: string
  try {
    token = await getContentToken()
  } catch (err) {
    console.error("[content/verse] Token error:", err)
    return NextResponse.json({ error: "Auth failed" }, { status: 500 })
  }

  const headers = { "x-auth-token": token, "x-client-id": clientId }
  const chapterNumber = verseKey.split(":")[0]

  // QF API: words=true and translations=131 conflict — use two parallel requests
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const [verseWithTextRes, verseWithTransRes, chapterRes, audioRes] = await Promise.all([
      fetch(`${apiUrl}/content/api/v4/verses/by_key/${verseKey}?fields=text_uthmani`, { headers, signal: controller.signal }),
      fetch(`${apiUrl}/content/api/v4/verses/by_key/${verseKey}?words=true&translations=131`, { headers, signal: controller.signal }),
      fetch(`${apiUrl}/content/api/v4/chapters/${chapterNumber}`, { headers, signal: controller.signal }),
   fetch(`${apiUrl}/content/api/v4/recitations/7/by_ayah/${verseKey}`, { headers, signal: controller.signal }),
    ])

    const [verseTextData, verseTransData, chapterData, audioData] = await Promise.all([
      verseWithTextRes.ok ? verseWithTextRes.json() : null,
      verseWithTransRes.ok ? verseWithTransRes.json() : null,
      chapterRes.ok ? chapterRes.json() : null,
      audioRes.ok ? audioRes.json() : null,
    ])

    // Merge: text from first response, words+translations from second
    const verse = {
      ...(verseTextData?.verse ?? {}),
      ...(verseTransData?.verse ?? {}),
    }

    return NextResponse.json(
      { verse, chapter: chapterData, audio: audioData },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    )
  } catch (err: unknown) {
    const isAbort = err instanceof Error && (err.name === "AbortError" || (err as { code?: number }).code === 20)
    console.error(`[content/verse] ${isAbort ? "Timeout" : "Fetch error"}:`, err)
    return NextResponse.json(
      { error: isAbort ? "QF API timeout" : "Fetch failed", verse: null, chapter: null, audio: null },
      { status: 504 }
    )
  } finally {
    clearTimeout(timeout)
  }
}
