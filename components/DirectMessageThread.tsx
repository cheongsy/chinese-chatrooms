"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ChatMessage, { type ChatMessageData } from "./ChatMessage";

export type DirectMessageData = ChatMessageData & { sender_id: string };

type OtherUser = { id: string; username: string; is_ai: boolean };

export default function DirectMessageThread({
  conversationId,
  otherUser,
  initialMessages,
  currentUserId,
  currentUsername,
}: {
  conversationId: string;
  otherUser: OtherUser;
  initialMessages: DirectMessageData[];
  currentUserId: string;
  currentUsername: string;
}) {
  const [messages, setMessages] = useState<DirectMessageData[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showPinyin, setShowPinyin] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());
  const profileCache = useRef<Map<string, { username: string; is_ai: boolean }>>(
    new Map([
      [otherUser.id, { username: otherUser.username, is_ai: otherUser.is_ai }],
      [currentUserId, { username: currentUsername, is_ai: false }],
    ])
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            content: string;
            created_at: string;
            sender_id: string;
          };

          const author = profileCache.current.get(row.sender_id) ?? {
            username: "Unknown",
            is_ai: false,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [
              ...prev,
              {
                id: row.id,
                content: row.content,
                created_at: row.created_at,
                sender_id: row.sender_id,
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
  }, [conversationId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setInput("");
    setSendError(null);

    const { data, error } = await supabase
      .from("direct_messages")
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content,
      })
      .select("id, content, created_at, sender_id")
      .single();

    setSending(false);
    if (error) {
      setSendError(`Couldn't send that message: ${error.message}`);
      setInput(content);
      return;
    }

    if (data) {
      const author = profileCache.current.get(data.sender_id) ?? {
        username: "You",
        is_ai: false,
      };
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, { ...data, author }];
      });
    }

    if (otherUser.is_ai) {
      fetch("/api/dm-ai-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      }).catch(() => {
        // best-effort: if this fails, sending the message itself still worked
      });
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] max-w-3xl mx-auto">
      <div className="border-b border-gray-200 px-4 py-3">
        <h1 className="font-semibold">
          {otherUser.username}
          {otherUser.is_ai && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
              AI
            </span>
          )}
        </h1>
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
            isOwn={message.sender_id === currentUserId}
            showPinyin={showPinyin}
            currentUserId={currentUserId}
            linkVocabToMessage={false}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-200 p-3">
        {sendError && <p className="text-sm text-red-600 mb-2">{sendError}</p>}
        <form onSubmit={handleSend} className="flex gap-2">
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
    </div>
  );
}
