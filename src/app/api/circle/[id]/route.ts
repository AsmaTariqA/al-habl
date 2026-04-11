import { NextRequest, NextResponse } from "next/server"
import { getRoom, getRoomMembers, getRoomPosts } from "@/lib/qf-api"
import { isSameStudyDate } from "@/lib/circle-constants"
import { getRequestAccessToken, setRoomCookie } from "@/lib/server-qf"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getRequestAccessToken(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const [room, members, posts] = await Promise.all([
    getRoom(auth.accessToken, id),
    getRoomMembers(auth.accessToken, id),
    getRoomPosts(auth.accessToken, id),
  ])

  if (!room) {
    return NextResponse.json({ error: "Circle not found." }, { status: 404 })
  }

  const response = NextResponse.json({
    room,
    members: members ?? [],
    posts: (posts ?? []).filter((post) => isSameStudyDate(post.created_at)),
  })
  setRoomCookie(response, id)
  return response
}
