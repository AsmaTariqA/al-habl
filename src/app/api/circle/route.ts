import { NextRequest, NextResponse } from "next/server"
import { createRoomResult, getRoom, getUserRoomsResult } from "@/lib/qf-api"
import { getRequestAccessToken } from "@/lib/server-qf"
import { setRoomCookie } from "@/lib/server-qf"

async function getUserRoomsResultWithTimeout(accessToken: string, timeoutMs = 4_000) {
  return Promise.race([
    getUserRoomsResult(accessToken),
    new Promise<Awaited<ReturnType<typeof getUserRoomsResult>>>((resolve) => {
      setTimeout(() => {
        resolve({
          rooms: [],
          error: {
            status: 0,
            statusText: "Timeout",
            message: "Room lookup timed out.",
            type: "timeout",
          },
        })
      }, timeoutMs)
    }),
  ])
}

export async function GET(request: NextRequest) {
  const auth = await getRequestAccessToken(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const existingRoomId = request.cookies.get("qf_room_id")?.value
  const room = existingRoomId
    ? await getRoom(auth.accessToken, existingRoomId)
    : null

  if (room) {
    const response = NextResponse.json({ room })
    setRoomCookie(response, room.id)
    return response
  }

  const roomList = await getUserRoomsResultWithTimeout(auth.accessToken)
  if (roomList.error) {
    if (roomList.error.type === "insufficient_scope") {
      return NextResponse.json({
        room: null,
        scopeLimited: true,
      })
    }

    if (roomList.error.type === "timeout") {
      return NextResponse.json({
        room: null,
        roomLookupTimedOut: true,
      })
    }

    return NextResponse.json(
      {
        error: roomList.error.message,
        type: roomList.error.type ?? null,
      },
      { status: roomList.error.status || 500 },
    )
  }

  const firstRoom = roomList.rooms[0] ?? null
  const response = NextResponse.json({ room: firstRoom })

  if (firstRoom) {
    setRoomCookie(response, firstRoom.id)
  }

  return response
}

export async function POST(request: NextRequest) {
  const auth = await getRequestAccessToken(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, description } = (await request.json()) as {
    name?: string
    description?: string
  }

  if (!name?.trim()) {
    return NextResponse.json({ error: "Circle name is required." }, { status: 400 })
  }

  const result = await createRoomResult(auth.accessToken, name.trim(), description?.trim())
  if (!result.room) {
    return NextResponse.json(
      {
        error:
          result.error?.type === "insufficient_scope"
            ? "Your Quran Foundation account is not enabled for circle creation yet."
            : result.error?.message ?? "We couldn't create your circle right now.",
        type: result.error?.type ?? null,
      },
      { status: result.error?.status || 500 },
    )
  }

  const response = NextResponse.json({
    room: result.room,
    inviteCode: result.room.invite_code ?? null,
  })
  setRoomCookie(response, result.room.id)

  return response
}
