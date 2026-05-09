import type { Metadata } from "next"
import { CircleHomeView } from "@/features/circle/CircleHomeView"
import { buildPageMetadata } from "@/lib/metadata/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Today's Circle",
  description:
    "Daily ayah, guided lenses, reflections, and circle feed — study one verse together with companions.",
})

export default function CirclePage() {
  return <CircleHomeView />
}
