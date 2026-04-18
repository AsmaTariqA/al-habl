import { NextRequest, NextResponse } from "next/server"
import { getRoom, getRoomMembers, getRoomPosts } from "@/lib/qf-api"
import { isSameStudyDate } from "@/lib/circle-constants"
import { getRequestAccessToken, setRoomCookie } from "@/lib/server-qf"
import { getSupabaseAdmin } from "@/lib/supabase"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getRequestAccessToken(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await context.params
  const [room, membersResult, postsResult] = await Promise.all([
    getRoom(auth.accessToken, id),
    getRoomMembers(auth.accessToken, id).catch(() => null),
    getRoomPosts(auth.accessToken, id).catch(() => null),
  ])

  if (!room) return NextResponse.json({ error: "Circle not found." }, { status: 404 })

  // Sync true member count from QF into Supabase
  const members = membersResult
  const trueCount = members?.length ?? room.member_count
  const supabase = getSupabaseAdmin()
  await supabase
    .from("al_habl_circles")
    .update({ member_count: trueCount })
    .eq("id", id)

  const response = NextResponse.json({
    room: { ...room, member_count: trueCount },
    members: members ?? [],
    posts: (postsResult ?? []).filter((post) => isSameStudyDate(post.created_at)),
  })
  setRoomCookie(response, id)
  return response
}