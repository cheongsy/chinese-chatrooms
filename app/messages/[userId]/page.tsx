import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import NavBar from "@/components/NavBar";
import DirectMessageThread from "@/components/DirectMessageThread";
import type { DirectMessageData } from "@/components/DirectMessageThread";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login");
  }

  await ensureProfile(supabase, userData.user);

  if (userId === userData.user.id) {
    notFound();
  }

  const { data: otherUser } = await supabase
    .from("profiles")
    .select("id, username, is_ai")
    .eq("id", userId)
    .maybeSingle();

  if (!otherUser) {
    notFound();
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userData.user.id)
    .single();

  const [userAId, userBId] = [userData.user.id, userId].sort();

  let { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_a_id", userAId)
    .eq("user_b_id", userBId)
    .maybeSingle();

  if (!conversation) {
    const { data: created } = await supabase
      .from("conversations")
      .insert({ user_a_id: userAId, user_b_id: userBId })
      .select("id")
      .single();
    conversation = created;
  }

  if (!conversation) {
    throw new Error("Failed to create conversation");
  }

  const { data: messagesRaw } = await supabase
    .from("direct_messages")
    .select("id, content, created_at, sender_id")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true })
    .limit(50);

  const initialMessages: DirectMessageData[] = (messagesRaw ?? []).map((m) => ({
    id: m.id,
    content: m.content,
    created_at: m.created_at,
    sender_id: m.sender_id,
    author:
      m.sender_id === otherUser.id
        ? { username: otherUser.username, is_ai: otherUser.is_ai }
        : { username: currentProfile?.username ?? "You", is_ai: false },
  }));

  return (
    <>
      <NavBar />
      <DirectMessageThread
        conversationId={conversation.id}
        otherUser={otherUser}
        initialMessages={initialMessages}
        currentUserId={userData.user.id}
        currentUsername={currentProfile?.username ?? "You"}
      />
    </>
  );
}
