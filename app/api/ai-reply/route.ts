import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAiReply, type ChatTurn } from "@/lib/claude";

const HISTORY_LIMIT = 10;

export async function POST(request: Request) {
  const { roomId } = await request.json();

  if (typeof roomId !== "string" || !roomId) {
    return NextResponse.json({ error: "roomId is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: persona } = await supabase
    .from("room_ai_personas")
    .select("profile_id, system_prompt")
    .eq("room_id", roomId)
    .limit(1)
    .maybeSingle();

  if (!persona) {
    // Room has no AI conversation partner configured; nothing to do.
    return NextResponse.json({ skipped: true });
  }

  const { data: recentMessages } = await supabase
    .from("messages")
    .select("content, user_id")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  const history: ChatTurn[] = (recentMessages ?? [])
    .slice()
    .reverse()
    .map((m) => ({
      author: m.user_id === persona.profile_id ? "ai" : "human",
      content: m.content,
    }));

  if (history.length === 0 || history[history.length - 1].author !== "human") {
    // Only reply when the most recent message came from a human.
    return NextResponse.json({ skipped: true });
  }

  try {
    const reply = await generateAiReply(persona.system_prompt, history);
    if (!reply) {
      return NextResponse.json({ skipped: true });
    }

    const { error } = await supabase.from("messages").insert({
      room_id: roomId,
      user_id: persona.profile_id,
      content: reply,
    });
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ai-reply error", error);
    return NextResponse.json({ error: "ai reply failed" }, { status: 502 });
  }
}
