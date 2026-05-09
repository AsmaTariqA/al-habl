import type { Metadata } from "next"
import { CredentialsLoginView } from "@/features/auth/CredentialsLoginView"
import { buildPageMetadata } from "@/lib/metadata/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Sign in",
  description:
    "Sign in with Quran Foundation OAuth to access your Al-Habl Quranic circle.",
})

export default function AuthLoginPage() {
  return <CredentialsLoginView />
}
