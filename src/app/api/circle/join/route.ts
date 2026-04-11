import { NextRequest, NextResponse } from "next/server"
import { acceptInviteByToken, getRoom, joinRoom, searchRooms } from "@/lib/qf-api"
import { getRequestAccessToken, setRoomCookie } from "@/lib/server-qf"

async function resolveRoomId(accessToken: string, roomId?: string, inviteCode?: string) {
  if (roomId) return roomId
  if (!inviteCode) return null

  // TODO: Verify invite-code lookup behavior in the QF room docs. This assumes search can resolve invite codes.
  const rooms = await searchRooms(accessToken, inviteCode.trim())
  const exactMatch = rooms?.find((room) => room.invite_code?.toLowerCase() === inviteCode.trim().toLowerCase())
  return exactMatch?.id ?? null
}

export async function POST(request: NextRequest) {
  const auth = await getRequestAccessToken(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as {
    roomId?: string
    inviteCode?: string
    inviteToken?: string
  }

  if (body.roomId && body.inviteToken) {
    const joined = await acceptInviteByToken(auth.accessToken, body.roomId, body.inviteToken)
    if (!joined) {
      return NextResponse.json({ error: "Invite token is invalid." }, { status: 409 })
    }

    const room = await getRoom(auth.accessToken, body.roomId)
    const response = NextResponse.json({ room })
    setRoomCookie(response, body.roomId)
    return response
  }

  const resolvedRoomId = await resolveRoomId(auth.accessToken, body.roomId, body.inviteCode)
  if (!resolvedRoomId) {
    return NextResponse.json({ error: "Circle not found." }, { status: 404 })
  }

  const joined = await joinRoom(auth.accessToken, resolvedRoomId)
  if (!joined) {
    return NextResponse.json(
      { error: "Circle is full or the invite is no longer valid." },
      { status: 409 },
    )
  }

  const room = await getRoom(auth.accessToken, resolvedRoomId)
  const response = NextResponse.json({ room })
  setRoomCookie(response, resolvedRoomId)
  return response
}
