import type { Metadata } from "next"
import { ProfileView } from "@/features/profile/ProfileView"
import { buildPageMetadata } from "@/lib/metadata/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Profile",
  description:
    "Your Quran streak, activity, goals, and saved content from Al-Habl circles.",
})

export default function ProfilePage() {
  return <ProfileView />
}
