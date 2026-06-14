// src/lib/mcp-client.ts – the client callMcpTool resolves to
const MCP_URL = `https://mcp.brightdata.com/mcp?token=${process.env.BRIGHTDATA_API_KEY}&pro=1`;

async function post(body: unknown, sessionId?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;
  return fetch(MCP_URL, { method: "POST", headers, body: JSON.stringify(body) });
}

// the server replies as SSE: one JSON object per `data:` line
function parseSse(text: string) {
  if (!text.includes("data:")) {
    try { return [JSON.parse(text)]; }
    catch { throw new Error(`MCP returned a non-JSON response: ${text.slice(0, 120)}`); }
  }
  return text.split("\n").filter((l) => l.startsWith("data:"))
    .map((l) => { try { return JSON.parse(l.slice(5).trim()); } catch { return null; } })
    .filter(Boolean);
}

export async function callMcpTool<T = unknown>(name: string, args: Record<string, unknown>): Promise<T> {
  // 1. initialize – the session id comes back as a response header
  const init = await post({ jsonrpc: "2.0", id: 1, method: "initialize",
    params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "intel", version: "1.0" } } });
  if (!init.ok) throw new Error(`MCP connection failed: HTTP ${init.status} ${init.statusText}. Check BRIGHTDATA_API_KEY.`);
  const sessionId = init.headers.get("mcp-session-id") ?? undefined;
  await init.text();

  // 2. confirm initialized, then 3. call the tool
  await post({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }, sessionId);
  const res = await post({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name, arguments: args } }, sessionId);
  if (!res.ok) throw new Error(`MCP tool call failed: HTTP ${res.status} ${res.statusText}.`);

  const reply = parseSse(await res.text()).find((m: { id?: number }) => m?.id === 2);
  if (reply?.error) throw new Error(`MCP error: ${reply.error.message}`);
  const text = reply?.result?.content?.find((c: { type: string }) => c.type === "text")?.text;
  const payload = text ? JSON.parse(text) : reply?.result;
  return (Array.isArray(payload) ? payload[0] : payload) as T;
}
