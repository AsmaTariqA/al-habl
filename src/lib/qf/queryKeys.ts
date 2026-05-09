/** Central keys for Quran Foundation TanStack queries — dedupes Strict Mode double-mount & cross-route navigation. */
export const qfKeys = {
  profile: () => ["qf", "profile"] as const,
  streaks: () => ["qf", "streaks"] as const,
  room: (id: string) => ["qf", "room", id] as const,
  members: (id: string) => ["qf", "members", id] as const,
  posts: (id: string) => ["qf", "posts", id] as const,
  /** Profile page secondary bundle (activity, goals, bookmarks, rooms, monthly count). */
  profileExtras: () => ["qf", "profile-extras"] as const,
}
