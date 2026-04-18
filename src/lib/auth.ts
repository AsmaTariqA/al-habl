import { OAuthTokenResponse, OAuthUserInfo, UserSession } from "@/types/auth";
import { getSupabaseAdmin } from "./supabase";
import { publicConfig } from "./config";

const QF_SCOPES = [
  "openid",
  "offline_access",
  "user",
  "room",
  "post",
  "comment",
  "bookmark",
  "collection",
  "note",
  "streak",
  "goal",
  "activity_day",
  "reading_session",
].join(" ");



const CONTENT_BASE = `${publicConfig.QF_API_URL}/content/api/v4`
const USER_BASE = `${publicConfig.QF_API_URL}/quran-reflect/v1`
const CLIENT_ID = publicConfig.QF_CLIENT_ID

// ─────────────────────────────────────────────────
// CONTENT TOKEN — client_credentials, server-side only
// Cached in memory, auto-refreshed before expiry
// ─────────────────────────────────────────────────
let contentTokenCache: { token: string; expiresAt: number } | null = null

async function getContentToken(): Promise<string> {
  if (contentTokenCache && Date.now() < contentTokenCache.expiresAt - 30_000) {
    return contentTokenCache.token
  }

  const res = await fetch(
    `${publicConfig.QF_AUTH_URL}/oauth2/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.NEXT_PUBLIC_QF_CLIENT_ID}:${process.env.QF_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'content',
      }).toString(),
    }
  )

  if (!res.ok) {
    throw new Error(`Content token request failed: ${res.status}`)
  }

  const data = await res.json()
  contentTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  return contentTokenCache.token
}

// ─────────────────────────────────────────────────
// HEADERS
// ─────────────────────────────────────────────────
function contentHeaders(contentToken: string) {
  return {
    'x-auth-token': contentToken,
    'x-client-id': CLIENT_ID,
    'Content-Type': 'application/json',
  }
}

function userHeaders(userAccessToken: string) {
  return {
    'x-auth-token': userAccessToken,
    'x-client-id': CLIENT_ID,
    'Content-Type': 'application/json',
  }
}
/**
 * Generate PKCE code challenge using SHA256
 */
async function generateCodeChallenge(): Promise<{ code: string; challenge: string }> {
  function generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  const codeVerifier = generateCodeVerifier();
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const challenge = btoa(String.fromCharCode(...hashArray))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return { code: codeVerifier, challenge };
}

/**
 * Build authorization URL
 */
export async function getAuthorizationUrl(): Promise<string> {
  const { code, challenge } = await generateCodeChallenge();
  const state = crypto.randomUUID();

  if (typeof window !== "undefined") {
    sessionStorage.setItem("pkce_code_verifier", code);
    sessionStorage.setItem("oauth_state", state);
  }

  const params = new URLSearchParams({
    client_id: publicConfig.QF_CLIENT_ID,
    redirect_uri: publicConfig.QF_REDIRECT_URI,
    response_type: "code",
    // This OAuth client rejected optional OIDC scopes like `email`, so keep the
    // request to the leaner scope set that can complete the login flow.
    scope: QF_SCOPES,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  return `${publicConfig.QF_AUTH_URL}/oauth2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens (server-side only)
 */
export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string
): Promise<OAuthTokenResponse> {
  const authUrl = publicConfig.QF_AUTH_URL;
  const clientId = process.env.NEXT_PUBLIC_QF_CLIENT_ID;
  const clientSecret = process.env.QF_CLIENT_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_QF_REDIRECT_URI;

  if (!authUrl || !clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing server configuration");
  }

  return requestOAuthToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
    authUrl,
    clientId,
    clientSecret,
  );
}

async function requestOAuthToken(
  baseBody: URLSearchParams,
  authUrl: string,
  clientId: string,
  clientSecret: string,
): Promise<OAuthTokenResponse> {
  async function requestToken(
    clientAuthMethod: "client_secret_basic" | "client_secret_post"
  ) {
    const body = new URLSearchParams(baseBody.toString());
    const headers: HeadersInit = {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    };

    if (clientAuthMethod === "client_secret_basic") {
      headers.Authorization = `Basic ${Buffer.from(
        `${clientId}:${clientSecret}`
      ).toString("base64")}`;
      body.delete("client_id");
    } else {
      body.set("client_secret", clientSecret);
    }

    const response = await fetch(`${authUrl}/oauth2/token`, {
      method: "POST",
      headers,
      body: body.toString(),
    });

    if (response.ok) {
      return response.json();
    }

    const errorText = (await response.text()).trim();
    const detail = errorText ? ` ${errorText}` : "";
    return {
      error: new Error(
        `Token exchange failed via ${clientAuthMethod} (${response.status} ${response.statusText}).${detail}`
      ),
      invalidClient: response.status === 401 && errorText.includes("\"invalid_client\""),
    };
  }

  const basicResult = await requestToken("client_secret_basic");
  if (!(basicResult instanceof Object && "error" in basicResult)) {
    return basicResult;
  }

  if (!basicResult.invalidClient) {
    throw basicResult.error;
  }

  const postResult = await requestToken("client_secret_post");
  if (!(postResult instanceof Object && "error" in postResult)) {
    return postResult;
  }

  throw postResult.error;
}

/**
 * Get user info from access token
 */
function normalizeUserInfo(userInfo: Partial<OAuthUserInfo> & {
  sub?: string;
  first_name?: string;
  last_name?: string;
}): OAuthUserInfo {
  if (!userInfo.sub) {
    throw new Error("User info payload did not include a subject");
  }

  const name =
    userInfo.name ??
    [userInfo.first_name, userInfo.last_name].filter(Boolean).join(" ").trim() ??
    userInfo.email ??
    userInfo.sub;

  return {
    sub: userInfo.sub,
    email: userInfo.email,
    name: name || userInfo.sub,
    first_name: userInfo.first_name,
    last_name: userInfo.last_name,
    picture: userInfo.picture,
    email_verified: userInfo.email_verified,
  };
}

function decodeJwtPayload<T>(token: string): T {
  const [, payload] = token.split(".");
  if (!payload) {
    throw new Error("Invalid ID token payload");
  }

  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const json = Buffer.from(padded, "base64").toString("utf8");

  return JSON.parse(json) as T;
}

export async function getUserInfo(
  accessToken: string,
  idToken?: string
): Promise<OAuthUserInfo> {
  const authUrl = publicConfig.QF_AUTH_URL;
  if (!authUrl) throw new Error("Missing QF_AUTH_URL");

  const userInfoUrls = [`${authUrl}/userinfo`, `${authUrl}/oauth2/userinfo`];

  for (const userInfoUrl of userInfoUrls) {
    const response = await fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      const payload = (await response.json()) as Partial<OAuthUserInfo> & {
        sub?: string;
        first_name?: string;
        last_name?: string;
      };
      return normalizeUserInfo(payload);
    }

    if (response.status !== 404) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`);
    }
  }

  if (idToken) {
    const payload = decodeJwtPayload<Partial<OAuthUserInfo> & {
      sub?: string;
      first_name?: string;
      last_name?: string;
    }>(idToken);
    return normalizeUserInfo(payload);
  }

  throw new Error("Failed to fetch user info: Not Found");
}

export async function storeUserSession(
  qfUserId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  const { error } = await supabaseAdmin.from("user_sessions").upsert(
    {
      qf_user_id: qfUserId,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt.toISOString(),
    },
    {
      onConflict: "qf_user_id",
    }
  );

  if (error) throw error;
}

export async function refreshUserSession(session: UserSession): Promise<UserSession | null> {
  const authUrl = publicConfig.QF_AUTH_URL;
  const clientId = process.env.NEXT_PUBLIC_QF_CLIENT_ID;
  const clientSecret = process.env.QF_CLIENT_SECRET;

  if (!authUrl || !clientId || !clientSecret || !session.refreshToken) {
    return null;
  }

  try {
    const tokens = await requestOAuthToken(
      new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        refresh_token: session.refreshToken,
      }),
      authUrl,
      clientId,
      clientSecret,
    );

    const nextRefreshToken = tokens.refresh_token || session.refreshToken;
    await storeUserSession(
      session.qfUserId,
      tokens.access_token,
      nextRefreshToken,
      tokens.expires_in
    );

    return {
      qfUserId: session.qfUserId,
      accessToken: tokens.access_token,
      refreshToken: nextRefreshToken,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    };
  } catch (error) {
    console.error("Failed to refresh user session:", error);
    return null;
  }
}

/**
 * Retrieve user session from Supabase (server-side only)
 */
export async function getUserSession(qfUserId: string): Promise<UserSession | null> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("user_sessions")
    .select("*")
    .eq("qf_user_id", qfUserId)
    .single();

  if (error || !data) return null;

  return {
    qfUserId: data.qf_user_id,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(data.expires_at),
  };
}


