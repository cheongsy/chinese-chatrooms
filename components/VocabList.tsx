"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SavedVocab } from "@/lib/supabase/types";

export default function VocabList({ initialVocab }: { initialVocab: SavedVocab[] }) {
  const [vocab, setVocab] = useState(initialVocab);
  const supabase = createClient();

  async function handleDelete(id: string) {
    setVocab((prev) => prev.filter((v) => v.id !== id));
    await supabase.from("saved_vocab").delete().eq("id", id);
  }

  if (vocab.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Click any Chinese character in a chatroom to save it here.
      </p>
    );
  }

  return (
    <ul className="grid gap-2">
      {vocab.map((word) => (
        <li
          key={word.id}
          className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2"
        >
          <div>
            <span className="text-lg mr-2">{word.hanzi}</span>
            <span className="text-sm text-gray-500 mr-2">{word.pinyin}</span>
            <span className="text-sm text-gray-700">{word.translation}</span>
          </div>
          <button
            onClick={() => handleDelete(word.id)}
            className="text-xs text-red-500 hover:underline"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}
