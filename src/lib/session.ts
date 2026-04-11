const ROOM_COOKIE_NAME = "qf_room_id"
const USER_COOKIE_NAME = "qf_user_id"

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`
}

export const session = {
  getUserId(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("qf_user_id")
  },
  getRoomId(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("qf_room_id")
  },
  setRoomId(id: string): void {
    if (typeof window === "undefined") return
    localStorage.setItem("qf_room_id", id)
    setCookie(ROOM_COOKIE_NAME, id)
  },
  clear(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem("qf_user_id")
    localStorage.removeItem("qf_room_id")
    clearCookie(USER_COOKIE_NAME)
    clearCookie(ROOM_COOKIE_NAME)
  },
}
