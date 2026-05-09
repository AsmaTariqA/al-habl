import type { Metadata } from "next"
import { buildPageMetadata } from "@/lib/metadata/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Signing in",
  description: "Completing Quran Foundation authentication for Al-Habl.",
})

export default function AuthCallbackLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
