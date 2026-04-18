// app/api/debug/route.ts
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll().map(c => c.name)

  return NextResponse.json({
    env: {
      QF_API_URL: process.env.NEXT_PUBLIC_QF_API_URL,
      QF_CLIENT_ID: process.env.NEXT_PUBLIC_QF_CLIENT_ID,
      HAS_CLIENT_SECRET: !!process.env.QF_CLIENT_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "NOT SET",
      NODE_ENV: process.env.NODE_ENV,
    },
    cookies: allCookies,
  })
}