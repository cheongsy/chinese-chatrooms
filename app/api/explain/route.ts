import { NextResponse } from "next/server";
import { explainMessage } from "@/lib/claude";

export async function POST(request: Request) {
  const { text } = await request.json();

  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const explanation = await explainMessage(text);
    return NextResponse.json(explanation);
  } catch (error) {
    console.error("explain error", error);
    return NextResponse.json({ error: "explain failed" }, { status: 502 });
  }
}
