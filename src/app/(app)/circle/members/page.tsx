import type { Metadata } from "next"
import { MembersView } from "@/features/circle/MembersView"
import { buildPageMetadata } from "@/lib/metadata/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Members",
  description:
    "See who belongs to your Quran circle, share the invite code, and track reflection participation.",
})

export default function MembersPage() {
  return <MembersView />
}
