import type { Metadata } from "next"
import { CircleAppChrome } from "@/features/circle/CircleAppChrome"
import { buildPageMetadata, SITE_DESCRIPTION } from "@/lib/metadata/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Circle",
  description: SITE_DESCRIPTION,
})

export default function CircleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CircleAppChrome>{children}</CircleAppChrome>
}
