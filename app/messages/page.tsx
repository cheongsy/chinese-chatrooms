import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import NavBar from "@/components/NavBar";
import UserList from "@/components/UserList";
import type { Profile } from "@/lib/supabase/types";

export default async function MessagesPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login");
  }

  await ensureProfile(supabase, userData.user);

  const { data: people } = await supabase
    .from("profiles")
    .select("*")
    .neq("id", userData.user.id)
    .order("is_ai", { ascending: true })
    .order("username", { ascending: true })
    .returns<Profile[]>();

  return (
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Messages</h1>
        <UserList people={people ?? []} />
      </main>
    </>
  );
}
