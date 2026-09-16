import { NextResponse } from "next/server";
import { translateToEnglish } from "@/lib/translate";

export async function POST(request: Request) {
  const { text } = await request.json();

  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const translation = await translateToEnglish(text);
    return NextResponse.json({ translation });
  } catch (error) {
    console.error("translate error", error);
    return NextResponse.json({ error: "translation failed" }, { status: 502 });
  }
}
