import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAiReply, type ChatTurn } from "@/lib/claude";

const HISTORY_LIMIT = 10;

export async function POST(request: Request) {
  const { conversationId } = await request.json();

  if (typeof conversationId !== "string" || !conversationId) {
    return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("user_a_id, user_b_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation) {
    return NextResponse.json({ skipped: true });
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, is_ai, system_prompt")
    .in("id", [conversation.user_a_id, conversation.user_b_id]);

  const aiPersona = profiles?.find((p) => p.is_ai);
  if (!aiPersona || !aiPersona.system_prompt) {
    // Neither participant is an AI persona; nothing to do.
    return NextResponse.json({ skipped: true });
  }

  const { data: recentMessages } = await supabase
    .from("direct_messages")
    .select("content, sender_id")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  const history: ChatTurn[] = (recentMessages ?? [])
    .slice()
    .reverse()
    .map((m) => ({
      author: m.sender_id === aiPersona.id ? "ai" : "human",
      content: m.content,
    }));

  if (history.length === 0 || history[history.length - 1].author !== "human") {
    // Only reply when the most recent message came from the human.
    return NextResponse.json({ skipped: true });
  }

  try {
    const reply = await generateAiReply(aiPersona.system_prompt, history);
    if (!reply) {
      return NextResponse.json({ skipped: true });
    }

    const { error } = await supabase.from("direct_messages").insert({
      conversation_id: conversationId,
      sender_id: aiPersona.id,
      content: reply,
    });
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("dm-ai-reply error", error);
    return NextResponse.json({ error: "ai reply failed" }, { status: 502 });
  }
}
