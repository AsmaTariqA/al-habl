import { NextRequest, NextResponse } from "next/server"
import { getRequestAccessToken, setRoomCookie } from "@/lib/server-qf"
import { getSupabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  const auth = await getRequestAccessToken(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await request.json()) as { roomId?: string }
  if (!body.roomId) return NextResponse.json({ error: "roomId required" }, { status: 400 })

  const { roomId } = body

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_QF_API_URL}/quran-reflect/v1/rooms/${roomId}/join`,
    {
      method: "POST",
      headers: {
        "x-auth-token": auth.accessToken,
        "x-client-id": process.env.NEXT_PUBLIC_QF_CLIENT_ID!,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    }
  )

  let alreadyMember = false

  if (!res.ok) {
    const errText = await res.text()
    const isAlreadyMember = errText.includes("ALREADY_A_MEMBER")
    if (!isAlreadyMember) {
      return NextResponse.json({ error: "Could not join circle." }, { status: 409 })
    }
    alreadyMember = true
  }

  // Only increment count for genuinely new joins
  if (!alreadyMember) {
    const supabase = getSupabaseAdmin()
    const { data: circle } = await supabase
      .from("al_habl_circles")
      .select("member_count")
      .eq("id", roomId)
      .single()

    if (circle) {
      await supabase
        .from("al_habl_circles")
        .update({ member_count: (circle.member_count ?? 1) + 1 })
        .eq("id", roomId)
    }
  }

  const response = NextResponse.json({ success: true, roomId })
  setRoomCookie(response, roomId)
  return response
}