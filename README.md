# Brand-visibility monitor

Runs a prompt against ChatGPT, Grok, and Perplexity and detects whether your brand is mentioned in each answer. This is the runnable version of **Use case 2** from the [brightdata-scrape Kiro Power](https://github.com/brightdata/kiro-powers) guide.

It queries each engine through Bright Data's [Web MCP server](https://brightdata.com/ai/mcp-server).

## Run it

```bash
npm install
cp .env.example .env.local   # paste your Bright Data token into BRIGHTDATA_API_KEY
npm run dev                  # open http://localhost:3000
```

You need a Bright Data token with **Pro mode** on ([pricing](https://brightdata.com/pricing/mcp-server)). ChatGPT and Perplexity return in seconds; Grok usually runs past the poll window, so it shows as "pending."

## Good to know

- `.env*` is gitignored, so your token is never committed.
- LLM answers are non-deterministic, so run the same prompt a few times before you trust a result.
