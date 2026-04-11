export interface OAuthTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  id_token?: string;
  scope?: string;
  expires_at?: string;
}

export interface OAuthUserInfo {
  sub: string;
  email?: string;
  name: string;
  first_name?: string;
  last_name?: string;
  picture?: string;
  email_verified?: boolean;
}

export interface UserSession {
  qfUserId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}
