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

    const tokens = await exchangeCodeForToken(code, codeVerifier);
    console.info("QF token exchange succeeded", {
      scope: tokens.scope ?? null,
      expiresIn: tokens.expires_in,
      hasRefreshToken: Boolean(tokens.refresh_token),
    });

    const userInfo = await getUserInfo(tokens.access_token, tokens.id_token);

    await storeUserSession(
      userInfo.sub,
      tokens.access_token,
      tokens.refresh_token,
      tokens.expires_in
    );

    const isProduction = process.env.NODE_ENV === "production"

    const response = NextResponse.json({
      success: true,
      userId: userInfo.sub,
      grantedScope: tokens.scope ?? null,
      access_token: tokens.access_token,
    });

    // Required by middleware to allow access to /circle
    response.cookies.set({
      name: "qf_user_id",
      value: userInfo.sub,
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    // Used by proxy route to get token server-side
    response.cookies.set({
      name: "qf_token",
      value: tokens.access_token,
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
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