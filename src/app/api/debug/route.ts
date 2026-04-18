import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
const cookieStore = await cookies() // ✅ important


  // Read both cookies
  const userIdHttpOnly = cookieStore.get("qf_user_id")?.value
  const userIdPub = cookieStore.get("qf_user_id_pub")?.value
 
  const allCookies = cookieStore.getAll().map(c => c.name)


  // Try Supabase lookup for whichever userId we have
  const userId = userIdHttpOnly ?? userIdPub
  let sessionRow: Record<string, unknown> | null = null
  let dbError: string | null = null
  let tokenTestResult: { status: number; body: unknown } | null = null

  if (userId) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("user_sessions")
      .select("qf_user_id, expires_at, access_token, refresh_token")
      .eq("qf_user_id", userId)
      .single()

    dbError = error?.message ?? null
    if (data) {
      sessionRow = {
        qf_user_id: data.qf_user_id,
        expires_at: data.expires_at,
        has_access_token: !!data.access_token,
        access_token_preview: data.access_token?.slice(0, 20) + "...",
        has_refresh_token: !!data.refresh_token,
      }

      // Actually test the access token against QF API
      if (data.access_token) {
        try {
          const testRes = await fetch(
            `${process.env.NEXT_PUBLIC_QF_API_URL}/quran-reflect/v1/users/profile`,
            {
              headers: {
                "x-auth-token": data.access_token,
                "x-client-id": process.env.NEXT_PUBLIC_QF_CLIENT_ID!,
                "Content-Type": "application/json",
              },
            }
          )
          const body = await testRes.json().catch(() => ({}))
          tokenTestResult = { status: testRes.status, body }
        } catch (err) {
          tokenTestResult = { status: 0, body: String(err) }
        }
      }
    }
  }

  return NextResponse.json({
    cookies: {
      all: allCookies,
      qf_user_id: userIdHttpOnly ?? "NOT SET",
      qf_user_id_pub: userIdPub ?? "NOT SET",
    },
    userId: userId ?? "NOT FOUND",
    db: {
      error: dbError,
      session: sessionRow,
    },
    tokenTest: tokenTestResult,
    env: {
      QF_API_URL: process.env.NEXT_PUBLIC_QF_API_URL,
      QF_CLIENT_ID: process.env.NEXT_PUBLIC_QF_CLIENT_ID,
      HAS_CLIENT_SECRET: !!process.env.QF_CLIENT_SECRET,
      HAS_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      HAS_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  })
}