import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn(
    "[Supabase] EXPO_PUBLIC_SUPABASE_URL ou EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY não configuradas.",
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
