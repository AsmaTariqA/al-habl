import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSupabaseAdmin } from "@/lib/supabase"

async function getValidToken(userId: string): Promise<string | null> {
  const supabase = getSupabaseAdmin()
  const { data: session } = await supabase
    .from("user_sessions")
    .select("*")
    .eq("qf_user_id", userId)
    .single()

  if (!session) return null

  if (new Date(session.expires_at) > new Date(Date.now() + 60_000)) {
    return session.access_token
  }

  const basicAuth = Buffer.from(
    `${process.env.NEXT_PUBLIC_QF_CLIENT_ID}:${process.env.QF_CLIENT_SECRET}`
  ).toString("base64")

  const res = await fetch(`${process.env.NEXT_PUBLIC_QF_AUTH_URL}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: session.refresh_token,
    }),
  })

  if (!res.ok) return null
  const tokens = await res.json()

  await supabase.from("user_sessions").update({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? session.refresh_token,
    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
  }).eq("qf_user_id", userId)

  return tokens.access_token
}

async function handler(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const cookieStore = await cookies()
  const userId = cookieStore.get("qf_user_id")?.value
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const token = await getValidToken(userId)
  if (!token) return NextResponse.json({ error: "No valid token" }, { status: 401 })

  const { path } = await context.params
  const search = request.nextUrl.search
  const url = `${process.env.NEXT_PUBLIC_QF_API_URL}/quran-reflect/v1/${path.join("/")}${search}`

  const init: RequestInit = {
    method: request.method,
    headers: {
      "x-auth-token": token,
      "x-client-id": process.env.NEXT_PUBLIC_QF_CLIENT_ID!,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text()
  }

  const qfRes = await fetch(url, init)
  const body = await qfRes.text()
  return new NextResponse(body, {
    status: qfRes.status,
    headers: { "Content-Type": "application/json" },
  })
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
export const PATCH = handler