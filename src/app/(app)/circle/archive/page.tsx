import type { Metadata } from "next"
import { ArchiveView } from "@/features/circle/ArchiveView"
import { buildPageMetadata } from "@/lib/metadata/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Archive",
  description:
    "Bookmarks, Quran collections, and private notes linked to verses you studied in Al-Habl.",
})

export default function ArchivePage() {
  return <ArchiveView />
}
