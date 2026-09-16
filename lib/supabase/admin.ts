import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Server-only client using the service-role key. Bypasses Row Level
// Security, so it must never be imported from client components and the
// service-role key must never be exposed to the browser. Used to insert
// AI-persona chat messages, which don't belong to a real auth.users row.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
