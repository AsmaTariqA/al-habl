import { NextRequest, NextResponse } from "next/server"
import { createRoom, getUserRoomsResult } from "@/lib/qf-api"
import { getRequestAccessToken, setRoomCookie } from "@/lib/server-qf"
import { getSupabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const auth = await getRequestAccessToken(request)

  const supabase = getSupabaseAdmin()
  const { data: circles } = await supabase
    .from("al_habl_circles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)

  if (!auth) {
    return NextResponse.json({ room: null, circles: circles ?? [], authenticated: false })
  }

  const { rooms, error } = await getUserRoomsResult(auth.accessToken)
  
  console.log("[GET /api/circle] userId:", auth.userId, "rooms:", rooms.length, "error:", error)

  const alHablIds = new Set((circles ?? []).map((c: { id: string }) => c.id))
  const myRoom = rooms.find((r) => alHablIds.has(r.id))

  console.log("[GET /api/circle] alHablIds:", [...alHablIds], "myRoom:", myRoom?.id ?? "none")

  if (myRoom) {
    return NextResponse.json({ room: myRoom, circles: circles ?? [], authenticated: true })
  }

  return NextResponse.json({ room: null, circles: circles ?? [], authenticated: true })
}

export async function POST(request: NextRequest) {
  const auth = await getRequestAccessToken(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await request.json()) as { name?: string; description?: string }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Circle name is required." }, { status: 400 })
  }

  const room = await createRoom(auth.accessToken, body.name.trim(), body.description ?? "")

  if (!room?.id) {
    return NextResponse.json({ error: "Failed to create circle." }, { status: 500 })
  }

  const supabase = getSupabaseAdmin()
  await supabase.from("al_habl_circles").upsert({
    id: room.id,
    name: room.name,
    description: room.description ?? "",
    invite_code: room.invite_code ?? null,
    member_count: 1,
    created_by: auth.userId,
  }, { onConflict: "id" })

  const response = NextResponse.json({
    room,
    inviteCode: room.invite_code ?? null,
  })
  setRoomCookie(response, room.id)
  return response
}