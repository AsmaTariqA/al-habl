import type { Metadata } from "next"

export const SITE_NAME = "Al-Habl"

/** Default OG / SEO description shared across routes */
export const SITE_DESCRIPTION =
  "Hold firmly to the rope of Allah — daily Quranic circles with guided reflection, companions, and Quran Foundation."

type PageMetaInput = Omit<Metadata, "title"> & {
  title: string
  description?: string
}

/** Consistent defaults: Open Graph site name mirrors root layout wording */
export function buildPageMetadata({
  title,
  description = SITE_DESCRIPTION,
  ...rest
}: PageMetaInput): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      type: "website",
      ...rest.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...rest.twitter,
    },
    ...rest,
  }
}
