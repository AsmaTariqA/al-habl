import type { Metadata } from "next"
import { Suspense } from "react"
import { LoginScreen } from "@/components/auth/LoginScreen"
import { buildPageMetadata } from "@/lib/metadata/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Sign in",
  description:
    "Sign in with Quran Foundation to join your Quranic circle on Al-Habl.",
})

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--ink)]" />}>
      <LoginScreen />
    </Suspense>
  )
}
