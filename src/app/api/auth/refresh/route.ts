import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const { userId } = await request.json()

  const supabase = getSupabaseAdmin()
  const { data: session } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('qf_user_id', userId)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'No session' }, { status: 401 })
  }

  const expiresAt = new Date(session.expires_at)
  const fiveMinFromNow = new Date(Date.now() + 5 * 60 * 1000)

  if (expiresAt > fiveMinFromNow) {
    return NextResponse.json({
      access_token: session.access_token,
      expiresIn: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    })
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_QF_AUTH_URL}/oauth2/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: session.refresh_token,
        client_id: process.env.NEXT_PUBLIC_QF_CLIENT_ID!,
        client_secret: process.env.QF_CLIENT_SECRET!,
      }),
    }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 })
  }

  const tokens = await res.json()
  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000)

  await supabase.from('user_sessions').update({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? session.refresh_token,
    expires_at: newExpiresAt.toISOString(),
  }).eq('qf_user_id', userId)

  return NextResponse.json({ access_token: tokens.access_token, expiresIn: tokens.expires_in })
}
