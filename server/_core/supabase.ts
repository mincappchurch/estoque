import { createClient } from "@supabase/supabase-js";
import { ENV } from "./env";

let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

export function hasSupabaseAdminConfig(): boolean {
  return Boolean(ENV.supabaseUrl && ENV.supabaseServiceRoleKey);
}

export function getSupabaseAdminClient() {
  if (!hasSupabaseAdminConfig()) {
    return null;
  }

  if (_supabaseAdmin) {
    return _supabaseAdmin;
  }

  _supabaseAdmin = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _supabaseAdmin;
}
