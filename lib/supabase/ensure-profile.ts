import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "./types";

// Guards against an auth.users row existing without a matching profiles
// row (e.g. a user created directly in the Supabase dashboard, bypassing
// the app's sign-up flow) — messages.user_id has an FK to profiles(id),
// so without this a signed-in user's message inserts fail silently.
export async function ensureProfile(
  supabase: SupabaseClient<Database>,
  user: User
) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return;

  const fallbackUsername = user.email?.split("@")[0] ?? user.id.slice(0, 8);

  await supabase.from("profiles").insert({
    id: user.id,
    username: fallbackUsername,
    native_lang: "en",
    target_lang: "zh",
    level: "beginner",
    is_ai: false,
  });
}
