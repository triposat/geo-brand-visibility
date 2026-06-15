# Brand-visibility monitor

Runs a prompt against ChatGPT, Grok, and Perplexity and flags whether your brand is mentioned in each answer. This is the runnable version of **Use case 2** from the [brightdata-scrape Kiro Power](https://github.com/brightdata/kiro-powers) guide.

It queries each engine through Bright Data's [Web MCP server](https://brightdata.com/ai/mcp-server) and renders the three answers side by side.

## Run it

```bash
npm install
cp .env.example .env.local   # paste your Bright Data token into BRIGHTDATA_API_KEY
npm run dev                  # open http://localhost:3000
```

You need a Bright Data token with **Pro mode** on ([pricing](https://brightdata.com/pricing/mcp-server)); these tools aren't free. ChatGPT and Perplexity return in seconds; Grok usually runs past the poll window, so it shows as "pending."

Prefer the command line? Capture one answer with:

```bash
node --env-file=.env.local scripts/run-geo.mjs "What is the best CDP for mid-market SaaS?" Segment
```

## Good to know

- Your token stays local. `.env*` is gitignored, so it's never committed.
- LLM answers are non-deterministic, so run the same prompt a few times before you trust a result.
