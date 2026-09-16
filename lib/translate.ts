const DEEPL_URL = "https://api-free.deepl.com/v2/translate";

export async function translateToEnglish(text: string): Promise<string> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPL_API_KEY is not set");
  }

  const res = await fetch(DEEPL_URL, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: [text],
      target_lang: "EN",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DeepL request failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { translations: { text: string }[] };
  return data.translations[0]?.text ?? "";
}
