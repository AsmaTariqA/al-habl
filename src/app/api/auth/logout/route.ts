import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Clear auth cookie
  response.cookies.delete("qf_user_id");
  response.cookies.delete("qf_room_id");

  return response;
}
