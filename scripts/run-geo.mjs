// scripts/run-geo.mjs — live capture for the article / smoke test.
// Run: node --env-file=.env.local scripts/run-geo.mjs ["your prompt"] [BrandToTrack]
// Self-contained (re-implements the MCP client) so it runs without a build step.
const MCP_URL = `https://mcp.brightdata.com/mcp?token=${process.env.BRIGHTDATA_API_KEY}&pro=1`;

async function post(body, sessionId) {
  const headers = { "Content-Type": "application/json", Accept: "application/json, text/event-stream" };
  if (sessionId) headers["mcp-session-id"] = sessionId;
  return fetch(MCP_URL, { method: "POST", headers, body: JSON.stringify(body) });
}

function parseSse(text) {
  if (!text.includes("data:")) {
    try { return [JSON.parse(text)]; } catch { throw new Error(`non-JSON response: ${text.slice(0, 160)}`); }
  }
  return text
    .split("\n")
    .filter((l) => l.startsWith("data:"))
    .map((l) => { try { return JSON.parse(l.slice(5).trim()); } catch { return null; } })
    .filter(Boolean);
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`client-side timeout after ${(ms / 1000).toFixed(0)}s (${label} did not return inline)`)), ms)),
  ]);
}

async function callMcpTool(name, args) {
  const init = await post({
    jsonrpc: "2.0", id: 1, method: "initialize",
    params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "geo", version: "1.0" } },
  });
  if (!init.ok) throw new Error(`initialize HTTP ${init.status} ${init.statusText}. Check BRIGHTDATA_API_KEY.`);
  const sessionId = init.headers.get("mcp-session-id") ?? undefined;
  await init.text();
  await post({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }, sessionId);
  const res = await post({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name, arguments: args } }, sessionId);
  if (!res.ok) throw new Error(`tools/call HTTP ${res.status} ${res.statusText}.`);
  const reply = parseSse(await res.text()).find((m) => m?.id === 2);
  if (reply?.error) throw new Error(`MCP error: ${reply.error.message}`);
  const t = reply?.result?.content?.find((c) => c.type === "text")?.text;
  const payload = t ? JSON.parse(t) : reply?.result;
  return Array.isArray(payload) ? payload[0] : payload;
}

const PROMPT = process.argv[2] ?? "What is the best CDP for mid-market SaaS?";
const BRAND = process.argv[3] ?? "Segment";
const ENGINES = [
  ["chatgpt", "web_data_chatgpt_ai_insights"],
  ["perplexity", "web_data_perplexity_ai_insights"],
  ["grok", "web_data_grok_ai_insights"],
];

if (!process.env.BRIGHTDATA_API_KEY) {
  console.error("BRIGHTDATA_API_KEY not set. Run: node --env-file=.env.local scripts/run-geo.mjs");
  process.exit(1);
}

console.log(`prompt: "${PROMPT}"  ·  tracking: ${BRAND}\n`);
for (const [engine, tool] of ENGINES) {
  const t0 = Date.now();
  try {
    const row = await withTimeout(callMcpTool(tool, { prompt: PROMPT }), 120000, engine);
    const md = row?.answer_text_markdown ?? "";
    console.log(`===== ${engine} (${tool}) — ${((Date.now() - t0) / 1000).toFixed(1)}s =====`);
    console.log(`returned keys: ${Object.keys(row ?? {}).join(", ") || "(none)"}`);
    console.log(`"${BRAND}" present: ${md.toLowerCase().includes(BRAND.toLowerCase())}`);
    console.log(`answer_text_markdown (first 700 chars):\n${md.slice(0, 700)}\n`);
  } catch (e) {
    console.log(`===== ${engine} (${tool}) — FAILED after ${((Date.now() - t0) / 1000).toFixed(1)}s =====`);
    console.log(`${e.message ?? e}\n`);
  }
}

process.exit(0); // force-exit in case a timed-out Grok fetch is still pending
