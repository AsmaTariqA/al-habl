import type { Metadata } from "next"
import { LandingPage } from "@/components/landing/LandingPage"
import { buildPageMetadata } from "@/lib/metadata/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Home",
  description:
    "Daily ayah rhythm, guided reflection lenses, and human accountability — Al-Habl, the Quranic circle platform.",
})

export default function HomePage() {
  return <LandingPage />
}
