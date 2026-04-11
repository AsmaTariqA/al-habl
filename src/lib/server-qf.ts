import type { NextRequest, NextResponse } from "next/server"
import { getUserSession, refreshUserSession } from "@/lib/auth"

export function getRequestUserId(request: NextRequest) {
  return request.cookies.get("qf_user_id")?.value ?? request.headers.get("x-qf-user-id")
}

export async function getRequestAccessToken(request: NextRequest) {
  const userId = getRequestUserId(request)
  if (!userId) {
    return null
  }

  const session = await getUserSession(userId)
  if (!session?.accessToken) {
    return null
  }

  const expiresSoon = session.expiresAt.getTime() <= Date.now() + 60_000
  const activeSession = expiresSoon
    ? await refreshUserSession(session)
    : session

  if (!activeSession?.accessToken) {
    return null
  }

  return {
    userId,
    accessToken: activeSession.accessToken,
  }
}

export function setRoomCookie(response: NextResponse, roomId: string) {
  response.cookies.set({
    name: "qf_room_id",
    value: roomId,
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
}
