"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ChatMessage, { type ChatMessageData } from "./ChatMessage";
import type { Room } from "@/lib/supabase/types";

type StoredMessage = ChatMessageData & { user_id: string };

export default function ChatRoom({
  room,
  initialMessages,
  currentUserId,
}: {
  room: Room;
  initialMessages: StoredMessage[];
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<StoredMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showPinyin, setShowPinyin] = useState(true);
  const supabase = createClient();
  const profileCache = useRef<Map<string, { username: string; is_ai: boolean }>>(
    new Map(
      initialMessages.map((m) => [m.user_id, m.author] as const)
    )
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${room.id}`,
        },
        async (payload) => {
          const row = payload.new as {
            id: string;
            content: string;
            created_at: string;
            user_id: string;
          };

          let author = profileCache.current.get(row.user_id);
          if (!author) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("username, is_ai")
              .eq("id", row.user_id)
              .single();
            author = profile ?? { username: "Unknown", is_ai: false };
            profileCache.current.set(row.user_id, author);
          }

          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [
              ...prev,
              {
                id: row.id,
                content: row.content,
                created_at: row.created_at,
                user_id: row.user_id,
                author,
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setInput("");

    const { error } = await supabase.from("messages").insert({
      room_id: room.id,
      user_id: currentUserId,
      content,
    });

    setSending(false);
    if (error) return;

    fetch("/api/ai-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: room.id }),
    }).catch(() => {
      // best-effort: if this fails, the human conversation still works fine
    });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] max-w-3xl mx-auto">
      <div className="border-b border-gray-200 px-4 py-3">
        <h1 className="font-semibold">{room.name}</h1>
        <label className="flex items-center gap-2 text-sm text-gray-600 mt-1">
          <input
            type="checkbox"
            checked={showPinyin}
            onChange={(e) => setShowPinyin(e.target.checked)}
          />
          Show pinyin
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isOwn={message.user_id === currentUserId}
            showPinyin={showPinyin}
            currentUserId={currentUserId}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-gray-200 p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message in Chinese or English..."
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
