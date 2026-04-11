import { NextRequest, NextResponse } from "next/server"
import { createPost, getRoomPosts } from "@/lib/qf-api"
import { getTodayVerseKey, isSameStudyDate, LENSES } from "@/lib/circle-constants"
import { getRequestAccessToken } from "@/lib/server-qf"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getRequestAccessToken(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const posts = await getRoomPosts(auth.accessToken, id)

  return NextResponse.json({
    posts: (posts ?? []).filter((post) => isSameStudyDate(post.created_at)),
  })
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getRequestAccessToken(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const body = (await request.json()) as {
    body?: string
    lens?: string
    tags?: string[]
    verseKey?: string
  }

  if (!body.body?.trim()) {
    return NextResponse.json({ error: "Reflection body is required." }, { status: 400 })
  }

  const lensTag: string = LENSES.includes(body.lens as (typeof LENSES)[number])
    ? body.lens ?? "relevance"
    : "relevance"
  const verseKey = body.verseKey ?? body.tags?.find((tag) => /^\d+:\d+$/.test(tag)) ?? getTodayVerseKey()
  const roomId = Number(id)

  if (!Number.isFinite(roomId)) {
    return NextResponse.json({ error: "Invalid room id." }, { status: 400 })
  }

  const post = await createPost(auth.accessToken, body.body.trim(), roomId, verseKey, lensTag)
  if (!post) {
    return NextResponse.json(
      { error: "Your reflection couldn't be posted." },
      { status: 500 },
    )
  }

  return NextResponse.json({ post })
}
