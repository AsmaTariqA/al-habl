import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()

  const userId = cookieStore.get('qf_user_id')?.value

  let resolvedUserId = userId
  if (!resolvedUserId) {
    const body = await request.json().catch(() => ({}))
    if (!body.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    resolvedUserId = body.userId
  }

  const supabase = getSupabaseAdmin()
  const { data: session } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('qf_user_id', resolvedUserId)
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

  const basicAuth = Buffer.from(
    `${process.env.NEXT_PUBLIC_QF_CLIENT_ID}:${process.env.QF_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_QF_AUTH_URL}/oauth2/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: session.refresh_token,
      }),
    }
  )

  if (!res.ok) {
    const errBody = await res.text()
    console.error('QF token refresh failed:', res.status, errBody)
    return NextResponse.json({ error: 'Session expired, please log in again' }, { status: 401 })
  }

  const tokens = await res.json()
  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000)

  await supabase.from('user_sessions').update({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? session.refresh_token,
    expires_at: newExpiresAt.toISOString(),
  }).eq('qf_user_id', resolvedUserId)

  return NextResponse.json({
    access_token: tokens.access_token,
    expiresIn: tokens.expires_in,
  })
}