// src/app/api/brand-visibility/route.ts
import { NextResponse } from "next/server";
import { checkVisibility, type EngineAnswer } from "@/scrapers/brand_visibility";

export const dynamic = "force-dynamic"; // always hit the live MCP, never cache

// The buyer query we monitor, and the brand whose visibility we track in the answer.
const PROMPT = "What is the best CDP for mid-market SaaS?";
const BRAND = "Segment";

export async function GET() {
  try {
    const { inline, grok } = await checkVisibility(PROMPT, BRAND);
    // Give Grok a short grace window, but never block the response on it.
    const grokResult = await Promise.race([
      grok,
      new Promise<null>((r) => setTimeout(() => r(null), 8000)),
    ]);
    const answers: EngineAnswer[] = grokResult ? [...inline, grokResult] : inline;
    return NextResponse.json({
      prompt: PROMPT,
      brand: BRAND,
      answers,
      grokPending: !grokResult, // Grok ran past the poll window
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
