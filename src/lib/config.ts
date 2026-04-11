const PRELIVE_AUTH_URL = "https://prelive-oauth2.quran.foundation";
const PRODUCTION_AUTH_URL = "https://oauth2.quran.foundation";
const PRELIVE_API_URL = "https://apis-prelive.quran.foundation";
const PRODUCTION_API_URL = "https://apis.quran.foundation";

function resolveQfEnv() {
  const explicitEnv = process.env.QF_ENV;
  if (explicitEnv === "prelive" || explicitEnv === "production") {
    return explicitEnv;
  }

  const authUrl = process.env.NEXT_PUBLIC_QF_AUTH_URL || "";
  if (authUrl.includes("prelive")) {
    return "prelive";
  }

  return "production";
}

const qfEnv = resolveQfEnv();

// Public environment variables (safe to expose to client)
export const publicConfig = {
  QF_ENV: qfEnv,
  QF_CLIENT_ID: process.env.NEXT_PUBLIC_QF_CLIENT_ID || '',
  QF_AUTH_URL: qfEnv === "prelive" ? PRELIVE_AUTH_URL : PRODUCTION_AUTH_URL,
  QF_API_URL: qfEnv === "prelive" ? PRELIVE_API_URL : PRODUCTION_API_URL,
  QF_REDIRECT_URI: process.env.NEXT_PUBLIC_QF_REDIRECT_URI || '',
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
};

// Validate required public config
if (!publicConfig.QF_CLIENT_ID || !publicConfig.QF_AUTH_URL) {
  console.warn('Missing Quran Foundation OAuth configuration');
}

const explicitApiUrl = process.env.NEXT_PUBLIC_QF_API_URL || "";
if (explicitApiUrl && explicitApiUrl !== publicConfig.QF_API_URL) {
  console.warn(
    `Ignoring mismatched NEXT_PUBLIC_QF_API_URL (${explicitApiUrl}) and using ${publicConfig.QF_API_URL} for ${publicConfig.QF_ENV}.`,
  );
}
