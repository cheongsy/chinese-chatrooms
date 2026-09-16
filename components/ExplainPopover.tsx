"use client";

import { useState } from "react";

type Explanation = {
  pinyin: string;
  gloss: string;
  grammarNote: string;
};

export default function ExplainPopover({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (open) {
      setOpen(false);
      return;
    }

    setOpen(true);
    if (explanation) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Explain failed");
      const data = await res.json();
      setExplanation(data);
    } catch {
      setError("Couldn't explain that message.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="text-xs text-purple-600 hover:underline disabled:opacity-50"
      >
        {loading ? "Explaining..." : open ? "Hide explanation" : "Explain"}
      </button>
      {open && explanation && (
        <div className="mt-1 rounded-md bg-purple-50 p-2 text-sm space-y-1">
          <p>
            <span className="font-medium">Pinyin:</span> {explanation.pinyin}
          </p>
          <p>
            <span className="font-medium">Meaning:</span> {explanation.gloss}
          </p>
          {explanation.grammarNote && (
            <p>
              <span className="font-medium">Note:</span> {explanation.grammarNote}
            </p>
          )}
        </div>
      )}
      {open && error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
