# Brand-visibility monitor

Checks how ChatGPT, Grok, and Perplexity answer a question, and flags whether your brand is named in each answer. This is the runnable version of **Use case 2** from the [brightdata-scrape Kiro Power](https://github.com/brightdata/kiro-powers) guide.

It asks each assistant through Bright Data's [Web MCP server](https://brightdata.com/ai/mcp-server) and shows the three answers side by side.

## Run it

```bash
npm install
cp .env.example .env.local   # paste your Bright Data token into BRIGHTDATA_API_KEY
npm run dev                  # open http://localhost:3000
```

You need a Bright Data token with **Pro mode** on ([pricing](https://brightdata.com/pricing/mcp-server)); these tools aren't free. ChatGPT and Perplexity answer in seconds, and Grok is slower, so it shows as "pending."

Prefer the command line? Capture one answer with:

```bash
node --env-file=.env.local scripts/run-geo.mjs "What is the best CDP for mid-market SaaS?" Segment
```

## Good to know

- Your token stays local. `.env*` is gitignored, so it's never committed.
- AI answers change from run to run, so check the same question a few times before you trust a result.
