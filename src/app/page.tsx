"use client";
import { useEffect, useState } from "react";

type Engine = "chatgpt" | "perplexity" | "grok";

interface EngineAnswer {
  engine: Engine;
  prompt: string;
  answer_text_markdown: string;
  brandPresent: boolean;
}

interface Payload {
  prompt: string;
  brand: string;
  answers: EngineAnswer[];
  grokPending: boolean;
  fetchedAt: string;
}

const ENGINES: { key: Engine; label: string; accent: string }[] = [
  { key: "chatgpt", label: "ChatGPT", accent: "border-t-emerald-400" },
  { key: "perplexity", label: "Perplexity", accent: "border-t-sky-400" },
  { key: "grok", label: "Grok", accent: "border-t-violet-400" },
];

export default function Home() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/brand-visibility")
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setData(d)))
      .catch((e) => setError(String(e)));
  }, []);

  const byEngine = (k: Engine) => data?.answers.find((a) => a.engine === k);

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold">Brand-visibility monitor</h1>
        <p className="mt-1 text-sm text-slate-500">
          Live from Bright Data <code>web_data_*_ai_insights</code> via the Web MCP server
          {data?.fetchedAt && <> · fetched {new Date(data.fetchedAt).toLocaleString()}</>}
        </p>
        {data && (
          <p className="mt-3 text-sm text-slate-700">
            Prompt: <span className="font-medium">&ldquo;{data.prompt}&rdquo;</span> · tracking{" "}
            <span className="font-medium">{data.brand}</span>
          </p>
        )}

        {error && (
          <div className="mt-6 rounded border border-red-300 bg-red-50 p-4 text-red-700">Error: {error}</div>
        )}
        {!data && !error && <div className="mt-6 text-slate-500">Asking the answer engines…</div>}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {ENGINES.map(({ key, label, accent }) => {
            const a = byEngine(key);
            const pending = key === "grok" && data?.grokPending && !a;
            return (
              <div
                key={key}
                className={`rounded-lg border border-slate-200 border-t-4 ${accent} bg-white p-5 shadow-sm`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{label}</h2>
                  {a ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        a.brandPresent ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {a.brandPresent ? `${data?.brand} mentioned` : `${data?.brand} absent`}
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      {pending ? "async · pending" : "—"}
                    </span>
                  )}
                </div>
                <p className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-sm text-slate-600">
                  {a
                    ? a.answer_text_markdown
                    : pending
                      ? "Grok ran past the MCP poll window; it returns asynchronously (eventually consistent)."
                      : ""}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
