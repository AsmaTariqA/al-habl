import type { Metadata } from "next"
import { OnboardingView } from "@/features/onboarding/OnboardingView"
import { buildPageMetadata } from "@/lib/metadata/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Onboarding",
  description:
    "Create or join a small Quranic circle — one ayah a day with companions on Al-Habl.",
})

export default function OnboardingPage() {
  return <OnboardingView />
}
