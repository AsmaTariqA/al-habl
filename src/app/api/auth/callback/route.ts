import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForToken,
  getUserInfo,
  storeUserSession,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, codeVerifier } = body;

    if (!code || !codeVerifier) {
      return NextResponse.json({ error: "missing_code_or_verifier" }, { status: 400 });
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForToken(code, codeVerifier);
    console.info("QF token exchange succeeded", {
      scope: tokens.scope ?? null,
      expiresIn: tokens.expires_in,
      hasRefreshToken: Boolean(tokens.refresh_token),
    });

    // Get user info
    const userInfo = await getUserInfo(tokens.access_token, tokens.id_token);

    // Store session in Supabase
    await storeUserSession(
      userInfo.sub,
      tokens.access_token,
      tokens.refresh_token,
      tokens.expires_in
    );

    // Create response with user redirected to /circle
    const response = NextResponse.json({
      success: true,
      userId: userInfo.sub,
      grantedScope: tokens.scope ?? null,
      access_token: tokens.access_token,
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: "qf_user_id",
      value: userInfo.sub,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : typeof error === "object" && error !== null && "message" in error
              ? String(error.message)
              : "Authentication failed",
      },
      { status: 500 }
    );
  }
}
