import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { getRequestAccessToken } from "@/lib/server-qf"
import { getTodayDayNumber, getTodayVerseKey } from "@/lib/circle-constants"

export async function GET(request: NextRequest) {
  const auth = await getRequestAccessToken(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getSupabaseAdmin()
  const today = new Date().toISOString().slice(0, 10)

  console.log("[daily-ayah GET] Fetching for date:", today)

  const { data, error } = await admin
    .from("daily_ayah_cache")
    .select("verse_key, chapter_number, verse_number, day_number, is_auto")
    .eq("date", today)
    .maybeSingle()

  if (error) {
    console.error("[daily-ayah GET] Supabase error:", error)
    const result = { verse_key: getTodayVerseKey(), is_auto: true, day_number: getTodayDayNumber() }
    console.log("[daily-ayah GET] Returning default due to error:", result)
    return NextResponse.json(result, { status: 200 })
  }

  if (!data) {
    const result = { verse_key: getTodayVerseKey(), is_auto: true, day_number: getTodayDayNumber() }
    console.log("[daily-ayah GET] No data found, returning default:", result)
    return NextResponse.json(result, { status: 200 })
  }

  console.log("[daily-ayah GET] Returning data from DB:", data)
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const auth = await getRequestAccessToken(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { verse_key, is_auto } = (await request.json()) as {
    verse_key?: string
    is_auto?: boolean
  }

  console.log("[daily-ayah POST] Input:", { verse_key, is_auto })

  if (!verse_key && !is_auto) {
    return NextResponse.json({ error: "verse_key or is_auto required" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const today = new Date().toISOString().slice(0, 10)

  const parts = (verse_key ?? getTodayVerseKey()).split(":")
  const chapter_number = Number(parts[0])
  const verse_number = Number(parts[1])

  const payload = {
    date: today,
    verse_key: verse_key ?? getTodayVerseKey(),
    chapter_number,
    verse_number,
    is_auto: is_auto ?? false,
    day_number: getTodayDayNumber(),
  }

  console.log("[daily-ayah POST] Payload:", payload)

  // First, try to update existing row
  const { data: existing, error: fetchError } = await admin
    .from("daily_ayah_cache")
    .select("id")
    .eq("date", today)
    .maybeSingle()

  if (fetchError) {
    console.error("[daily-ayah POST] Error checking existing row:", fetchError)
    return NextResponse.json({ error: "Failed to check existing row" }, { status: 500 })
  }

  let result
  if (existing) {
    // Row exists, update it
    console.log("[daily-ayah POST] Row exists, updating...")
    const { error: updateError } = await admin
      .from("daily_ayah_cache")
      .update(payload)
      .eq("date", today)

    if (updateError) {
      console.error("[daily-ayah POST] Update error:", updateError)
      return NextResponse.json({ error: "Failed to update" }, { status: 500 })
    }
    console.log("[daily-ayah POST] Successfully updated")
  } else {
    // Row doesn't exist, insert it
    console.log("[daily-ayah POST] Row doesn't exist, inserting...")
    const { error: insertError } = await admin
      .from("daily_ayah_cache")
      .insert([payload])

    if (insertError) {
      console.error("[daily-ayah POST] Insert error:", insertError)
      return NextResponse.json({ error: "Failed to insert" }, { status: 500 })
    }
    console.log("[daily-ayah POST] Successfully inserted")
  }

  console.log("[daily-ayah POST] Success, saved verse_key:", payload.verse_key)
  return NextResponse.json({ success: true, verse_key: payload.verse_key })
}