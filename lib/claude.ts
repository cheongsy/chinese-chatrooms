import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

const MODEL = "claude-sonnet-5";

export type Explanation = {
  pinyin: string;
  gloss: string;
  grammarNote: string;
};

export async function explainMessage(text: string): Promise<Explanation> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 400,
    system:
      "You are a Chinese-language tutor. Given a short Chinese message, respond with ONLY a JSON object " +
      '(no markdown fences) with keys "pinyin" (the full pinyin with tone marks), ' +
      '"gloss" (a natural English translation), and "grammarNote" (one or two short sentences ' +
      "explaining any notable grammar, vocab, or usage points a learner should notice). Keep it concise.",
    messages: [{ role: "user", content: text }],
  });

  const block = response.content.find((b) => b.type === "text");
  const raw = block && block.type === "text" ? block.text : "{}";
  const jsonText = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "");

  try {
    const parsed = JSON.parse(jsonText);
    return {
      pinyin: parsed.pinyin ?? "",
      gloss: parsed.gloss ?? "",
      grammarNote: parsed.grammarNote ?? "",
    };
  } catch {
    return { pinyin: "", gloss: raw, grammarNote: "" };
  }
}

export type ChatTurn = { author: "human" | "ai"; content: string };

export async function generateAiReply(
  systemPrompt: string,
  history: ChatTurn[]
): Promise<string> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 300,
    system: systemPrompt,
    messages: history.map((turn) => ({
      role: turn.author === "human" ? ("user" as const) : ("assistant" as const),
      content: turn.content,
    })),
  });

  const block = response.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text.trim() : "";
}
