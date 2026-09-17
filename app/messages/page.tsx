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

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, user_a_id, user_b_id")
    .or(`user_a_id.eq.${userData.user.id},user_b_id.eq.${userData.user.id}`);

  const otherUserIdByConversation = new Map<string, string>();
  for (const c of conversations ?? []) {
    const otherId = c.user_a_id === userData.user.id ? c.user_b_id : c.user_a_id;
    otherUserIdByConversation.set(c.id, otherId);
  }

  const unreadCounts: Record<string, number> = {};
  const conversationIds = [...otherUserIdByConversation.keys()];
  if (conversationIds.length > 0) {
    const { data: readRows } = await supabase
      .from("conversation_reads")
      .select("conversation_id, last_read_at")
      .eq("user_id", userData.user.id)
      .in("conversation_id", conversationIds);

    const lastReadByConversation = new Map<string, string>(
      (readRows ?? []).map((r) => [r.conversation_id, r.last_read_at])
    );

    const { data: messageRows } = await supabase
      .from("direct_messages")
      .select("conversation_id, sender_id, created_at")
      .in("conversation_id", conversationIds);

    for (const row of messageRows ?? []) {
      if (row.sender_id === userData.user.id) continue;

      const lastReadAt = lastReadByConversation.get(row.conversation_id);
      const isUnread = !lastReadAt || row.created_at > lastReadAt;
      if (!isUnread) continue;

      const otherId = otherUserIdByConversation.get(row.conversation_id);
      if (!otherId) continue;
      unreadCounts[otherId] = (unreadCounts[otherId] ?? 0) + 1;
    }
  }

  return (
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Messages</h1>
        <UserList people={people ?? []} unreadCounts={unreadCounts} />
      </main>
    </>
  );
}
