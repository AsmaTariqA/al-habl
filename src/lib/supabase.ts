import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
}

// Client-side Supabase client (safe to use in browser)
export const supabase = createClient(
  supabaseUrl,
  anonKey || ""
);

// Server-only admin client (for secure operations)
let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin() {
  if (typeof window !== "undefined") {
    throw new Error("getSupabaseAdmin() can only be called on the server");
  }

  if (!adminClient) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
    }
    adminClient = createClient(supabaseUrl!, serviceRoleKey);
  }

  return adminClient;
}
