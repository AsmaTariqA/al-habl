import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("qf_user_id")?.value

  if (!userId) return NextResponse.json({ error: "no qf_user_id cookie" }, { status: 401 })

  const supabase = getSupabaseAdmin()
  const { data: session } = await supabase
    .from("user_sessions")
    .select("*")
    .eq("qf_user_id", userId)
    .single()

  if (!session) return NextResponse.json({ error: "no session in db" }, { status: 404 })

  const basicAuth = Buffer.from(
    `${process.env.NEXT_PUBLIC_QF_CLIENT_ID}:${process.env.QF_CLIENT_SECRET}`
  ).toString("base64")

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_QF_AUTH_URL}/oauth2/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: session.refresh_token,
      }),
    }
  )

  const body = await res.json().catch(() => ({}))

  if (!res.ok) {
    return NextResponse.json({
      error: "refresh_failed",
      status: res.status,
      body,
      refresh_token_preview: session.refresh_token?.slice(0, 20) + "...",
      auth_url_used: process.env.NEXT_PUBLIC_QF_AUTH_URL,
    })
  }

  const newExpiresAt = new Date(Date.now() + body.expires_in * 1000)
  await supabase.from("user_sessions").update({
    access_token: body.access_token,
    refresh_token: body.refresh_token ?? session.refresh_token,
    expires_at: newExpiresAt.toISOString(),
  }).eq("qf_user_id", userId)

  const testRes = await fetch(
    `${process.env.NEXT_PUBLIC_QF_API_URL}/quran-reflect/v1/users/profile`,
    {
      headers: {
        "x-auth-token": body.access_token,
        "x-client-id": process.env.NEXT_PUBLIC_QF_CLIENT_ID!,
      },
    }
  )
  const testBody = await testRes.json().catch(() => ({}))

  return NextResponse.json({
    refresh: "success",
    new_expires_at: newExpiresAt.toISOString(),
    profile_test: { status: testRes.status, body: testBody },
  })
}