"use client";

import { useState } from "react";

export default function TranslateButton({ text }: { text: string }) {
  const [translation, setTranslation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (translation) {
      setTranslation(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Translation failed");
      const data = await res.json();
      setTranslation(data.translation);
    } catch {
      setError("Couldn't translate that message.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="text-xs text-blue-600 hover:underline disabled:opacity-50"
      >
        {loading ? "Translating..." : translation ? "Hide translation" : "Translate"}
      </button>
      {translation && <p className="mt-1 text-sm text-gray-600 italic">{translation}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
