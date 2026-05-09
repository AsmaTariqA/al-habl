import type { Metadata } from "next"
import { ChatView } from "@/features/circle/ChatView"
import { buildPageMetadata } from "@/lib/metadata/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Circle chat",
  description:
    "Short messages alongside your circle’s daily Quran reflection — realtime chat powered by Supabase.",
})

export default function ChatPage() {
  return <ChatView />
}
