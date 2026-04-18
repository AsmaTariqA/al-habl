import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { getRequestAccessToken } from "@/lib/server-qf"
import { getTodayDayNumber, getTodayVerseKey } from "@/lib/circle-constants"

export async function GET(request: NextRequest) {
  const auth = await getRequestAccessToken(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getSupabaseAdmin()
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await admin
    .from("daily_ayah_cache")
    .select("verse_key, chapter_number, verse_number, lens, day_number, is_auto")
    .eq("date", today)
    .maybeSingle()

  if (error) {
    console.error("[daily-ayah GET] Supabase error:", error)
    return NextResponse.json({ verse_key: getTodayVerseKey(), is_auto: true, day_number: getTodayDayNumber() }, { status: 200 })
  }

  if (!data) {
    return NextResponse.json({ verse_key: getTodayVerseKey(), is_auto: true, day_number: getTodayDayNumber() }, { status: 200 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const auth = await getRequestAccessToken(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { verse_key, is_auto } = (await request.json()) as {
    verse_key?: string
    is_auto?: boolean
  }

  if (!verse_key && !is_auto) {
    return NextResponse.json({ error: "verse_key or is_auto required" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const today = new Date().toISOString().slice(0, 10)

  const parts = (verse_key ?? getTodayVerseKey()).split(":")
  const chapter_number = Number(parts[0])
  const verse_number = Number(parts[1])

  const { error } = await admin
    .from("daily_ayah_cache")
    .upsert(
      {
        date: today,
        verse_key: verse_key ?? getTodayVerseKey(),
        chapter_number,
        verse_number,
        is_auto: is_auto ?? false,
        day_number: getTodayDayNumber(),
      },
      { onConflict: "date" },
    )

  if (error) {
    // If upsert with conflict fails (e.g. row exists and some field violates), try UPDATE
    const { error: updateError } = await admin
      .from("daily_ayah_cache")
      .update({
        verse_key: verse_key ?? getTodayVerseKey(),
        chapter_number,
        verse_number,
        is_auto: is_auto ?? false,
        day_number: getTodayDayNumber(),
      })
      .eq("date", today)

    if (updateError) {
      console.error("[daily-ayah POST] Supabase error:", updateError)
      return NextResponse.json({ error: "Failed to save" }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true, verse_key: verse_key ?? getTodayVerseKey() })
}