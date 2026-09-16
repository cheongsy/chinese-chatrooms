import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import ChatRoom from "@/components/ChatRoom";
import type { ChatMessageData } from "@/components/ChatMessage";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login");
  }

  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (!room) {
    notFound();
  }

  const { data: messagesRaw } = await supabase
    .from("messages")
    .select("id, content, created_at, user_id, profiles(username, is_ai)")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .limit(50);

  const initialMessages: (ChatMessageData & { user_id: string })[] = (
    messagesRaw ?? []
  ).map((m) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return {
      id: m.id,
      content: m.content,
      created_at: m.created_at,
      user_id: m.user_id,
      author: {
        username: profile?.username ?? "Unknown",
        is_ai: profile?.is_ai ?? false,
      },
    };
  });

  return (
    <>
      <NavBar />
      <ChatRoom
        room={room}
        initialMessages={initialMessages}
        currentUserId={userData.user.id}
      />
    </>
  );
}
