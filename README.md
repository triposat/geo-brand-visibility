# Brand-visibility monitor (Bright Data Web MCP demo)

A minimal, runnable Next.js app that tracks how the answer engines (ChatGPT, Grok, Perplexity)
respond to a buyer query, using Bright Data's `web_data_*_ai_insights` Pro tools over the
[Web MCP server](https://brightdata.com/ai/mcp-server). It's the runnable version of
**Use case 2** from the brightdata-scrape Kiro Power article.

One MCP call per engine returns the rendered LLM answer as a single `answer_text_markdown`
string; the dashboard renders a 3-engine grid and flags whether your tracked brand still
appears in each answer.

## What's inside

| File | Role |
|------|------|
| `src/lib/mcp-client.ts` | Thin MCP **Streamable HTTP** client (`callMcpTool`): `initialize` → session header → `notifications/initialized` → `tools/call`, with SSE parsing. The same client works for any `web_data_*` tool. |
| `src/scrapers/brand_visibility.ts` | `checkVisibility` (ChatGPT + Perplexity inline via `Promise.all`, Grok non-blocking) + `mentionsBrand` / `brandDropped` for day-over-day alerting. |
| `src/app/api/brand-visibility/route.ts` | API route; asks the engines live for one prompt. |
| `src/app/page.tsx` | 3-engine dashboard that fetches the route on mount. |
| `scripts/run-geo.mjs` | Standalone live-capture script (no build step) for verifying the response shape. |

## Prerequisites

- A **Bright Data** account with **Pro mode** ([pricing](https://brightdata.com/pricing/mcp-server)) — the `web_data_*_ai_insights` tools are **not** in the free tier.
- Node 20+.

## Run it

```bash
npm install
cp .env.example .env.local      # then paste your token
npm run dev                     # http://localhost:3000
```

`.env.local`:

```bash
BRIGHTDATA_API_KEY=your-token-here   # from brightdata.com/cp/setting/users
```

The MCP URL hardcodes `&pro=1` (in `src/lib/mcp-client.ts`) — that's what exposes the Pro
`web_data_*_ai_insights` tools. ChatGPT and Perplexity return in ~tens of seconds; Grok often
runs past the MCP poll window and returns asynchronously, so the dashboard marks it "async ·
pending" rather than blocking on it.

To capture the raw response shape without the UI:

```bash
node --env-file=.env.local scripts/run-geo.mjs "What is the best CDP for mid-market SaaS?" Segment
```

## Notes

- **Don't commit your token.** `.env*` is gitignored.
- LLM answers are non-deterministic: the same prompt can rank brands differently from one run
  to the next. A single daily fetch is one sample, not a stable signal — sample each prompt a
  few times, or smooth over several days, before you treat a brand dropping out as real.
- `mentionsBrand` is a naive case-insensitive substring check; for stricter matching (casing,
  name variants, brand-inside-a-word), pass the markdown to a cheap LLM call and ask for the
  ranked list.
