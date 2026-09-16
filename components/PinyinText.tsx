"use client";

import { pinyin } from "pinyin-pro";

const HANZI_PATTERN = /[一-鿿]/;

export default function PinyinText({
  text,
  showPinyin,
  onHanziClick,
  savedChars,
}: {
  text: string;
  showPinyin: boolean;
  onHanziClick?: (char: string, charPinyin: string) => void;
  savedChars?: Set<string>;
}) {
  const chars = pinyin(text, { type: "array" });
  const segments = Array.from(text);

  return (
    <span className="inline-flex flex-wrap gap-x-0.5 align-bottom">
      {segments.map((char, i) => {
        const isHanzi = HANZI_PATTERN.test(char);
        const charPinyin = chars[i] ?? "";
        const isSaved = savedChars?.has(char);

        const inner = (
          <span className="inline-flex flex-col items-center leading-tight">
            {showPinyin && (
              <span className="text-[0.65rem] text-gray-500">
                {isHanzi ? charPinyin : " "}
              </span>
            )}
            <span>{char}</span>
          </span>
        );

        if (isHanzi && onHanziClick) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onHanziClick(char, charPinyin)}
              title="Save to My Vocab"
              className={`rounded ${
                isSaved ? "bg-yellow-100" : "hover:bg-gray-100"
              }`}
            >
              {inner}
            </button>
          );
        }

        return <span key={i}>{inner}</span>;
      })}
    </span>
  );
}
