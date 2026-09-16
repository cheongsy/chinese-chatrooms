"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PinyinText from "./PinyinText";
import TranslateButton from "./TranslateButton";
import ExplainPopover from "./ExplainPopover";

export type ChatMessageData = {
  id: string;
  content: string;
  created_at: string;
  author: {
    username: string;
    is_ai: boolean;
  };
};

export default function ChatMessage({
  message,
  isOwn,
  showPinyin,
  currentUserId,
}: {
  message: ChatMessageData;
  isOwn: boolean;
  showPinyin: boolean;
  currentUserId: string;
}) {
  const [savedChars, setSavedChars] = useState<Set<string>>(new Set());

  async function handleSaveWord(char: string, charPinyin: string) {
    if (savedChars.has(char)) return;

    setSavedChars((prev) => new Set(prev).add(char));

    const supabase = createClient();
    let translation: string | null = null;
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: char }),
      });
      if (res.ok) {
        const data = await res.json();
        translation = data.translation ?? null;
      }
    } catch {
      // translation is best-effort for a saved word; save it without one if it fails
    }

    await supabase.from("saved_vocab").insert({
      user_id: currentUserId,
      hanzi: char,
      pinyin: charPinyin,
      translation,
      source_message_id: message.id,
    });
  }

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-md rounded-lg px-3 py-2 ${
          isOwn
            ? "bg-blue-600 text-white"
            : message.author.is_ai
              ? "bg-green-50 border border-green-200"
              : "bg-gray-100"
        }`}
      >
        <p className="text-xs font-medium mb-1 opacity-70">
          {message.author.username}
        </p>
        <div className="text-base">
          <PinyinText
            text={message.content}
            showPinyin={showPinyin}
            onHanziClick={isOwn ? undefined : handleSaveWord}
            savedChars={savedChars}
          />
        </div>
        {!isOwn && (
          <div className="mt-2 flex gap-3">
            <TranslateButton text={message.content} />
            <ExplainPopover text={message.content} />
          </div>
        )}
      </div>
    </div>
  );
}
