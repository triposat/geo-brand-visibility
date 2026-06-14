// src/scrapers/brand_visibility.ts
// One MCP call per answer engine; collects the rendered LLM answer and flags whether a
// tracked brand still appears. Field shape verified live against web_data_*_ai_insights.
import { callMcpTool } from "@/lib/mcp-client";

export type Engine = "chatgpt" | "perplexity" | "grok";

export interface EngineAnswer {
  engine: Engine;
  prompt: string;
  answer_text_markdown: string;
  brandPresent: boolean;
}

// Each web_data_*_ai_insights tool IS its engine (there's no engine selector). It takes a
// single { prompt } and returns the rendered answer as one answer_text_markdown string.
const TOOL: Record<Engine, string> = {
  chatgpt: "web_data_chatgpt_ai_insights",
  perplexity: "web_data_perplexity_ai_insights",
  grok: "web_data_grok_ai_insights",
};

// Naive presence check: case-insensitive substring. This misses casing variants, name
// aliases, and a brand appearing inside another word. For stricter matching, pass the
// markdown to a cheap LLM call and ask for the ranked list.
export function mentionsBrand(markdown: string, brand: string): boolean {
  return markdown.toLowerCase().includes(brand.toLowerCase());
}

async function askEngine(engine: Engine, prompt: string, brand: string): Promise<EngineAnswer> {
  const row = await callMcpTool<{ answer_text_markdown?: string }>(TOOL[engine], { prompt });
  const md = row?.answer_text_markdown ?? "";
  return { engine, prompt, answer_text_markdown: md, brandPresent: mentionsBrand(md, brand) };
}

// ChatGPT and Perplexity return inline and run together under Promise.all. Grok usually
// runs past the MCP poll window, so it stays on a separate non-blocking path; treat it as
// eventually-consistent, not a blocking call.
export async function checkVisibility(prompt: string, brand: string) {
  const inline = await Promise.all([
    askEngine("chatgpt", prompt, brand),
    askEngine("perplexity", prompt, brand),
  ]);
  const grok = askEngine("grok", prompt, brand).catch(() => null); // non-blocking
  return { inline, grok };
}

// Store one EngineAnswer row per (engine x day); alert when a brand that used to appear
// drops out. Pure function, so you can diff consecutive daily snapshots.
export function brandDropped(prev: EngineAnswer, now: EngineAnswer): boolean {
  return prev.brandPresent && !now.brandPresent;
}
