import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output } from "ai";
import { z } from "zod";
import type { NewsEvent } from "./signals";

const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

function createRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  return {
    getRunId: () => runId,
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      const response = await fetch(input, { ...init, headers });
      runId ??= response.headers.get(LOVABLE_AIG_RUN_ID_HEADER)?.trim() || undefined;
      return response;
    },
  };
}

const analysisSchema = z.object({
  outlook: z.string().describe("2-3 sentence weekly outlook for gold and Nasdaq based on this week's high-impact USD events"),
  xauusd: z.object({
    action: z.enum(["BUY", "SELL", "NEUTRAL"]),
    confidence: z.number().min(50).max(95),
    reasoning: z.string().describe("1-2 sentences"),
    entry: z.number().nullable(),
    stopLoss: z.number().nullable(),
    takeProfit: z.number().nullable(),
  }),
  nasdaq: z.object({
    action: z.enum(["BUY", "SELL", "NEUTRAL"]),
    confidence: z.number().min(50).max(95),
    reasoning: z.string().describe("1-2 sentences"),
    entry: z.number().nullable(),
    stopLoss: z.number().nullable(),
    takeProfit: z.number().nullable(),
  }),
  events: z.array(
    z.object({
      title: z.string(),
      bias: z.enum(["bullish", "bearish", "neutral"]),
      note: z.string().describe("one short sentence on expected market reaction"),
    }),
  ),
});

export type AiAnalysis = z.infer<typeof analysisSchema> & { generatedAt: string };

/** Ask the AI to analyse this week's red-folder USD events and produce signals for gold and Nasdaq. */
export async function runAiAnalysis(events: NewsEvent[], prices: { xauusd: number | null; qqq: number | null }): Promise<AiAnalysis> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

  const runIdFetch = createRunIdFetch();
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const eventLines = events
    .map(
      (e) =>
        `- ${e.time.slice(0, 16)}Z | ${e.title} | forecast: ${e.forecast ?? "n/a"}${e.unit} | previous: ${e.previous ?? "n/a"}${e.unit} | actual: ${e.actual ?? "not released"}`,
    )
    .join("\n");

  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    system:
      "You are a macro trading analyst. Analyse high-impact US economic events and give directional signals for XAUUSD (gold) and the Nasdaq 100. Stronger-than-expected US data usually lifts the dollar and yields, pressuring gold and tech; weak data does the opposite. Confidence is 50-95, never 100. Suggest entry, stop loss and take profit levels near the current prices given, with roughly 1:2 risk-reward; use null when the action is NEUTRAL. Keep every text field short.",
    messages: [
      {
        role: "user",
        content: `This week's high-impact USD events:\n${eventLines || "(none)"}\n\nCurrent prices: XAUUSD ${prices.xauusd ?? "unknown"}, Nasdaq 100 proxy (QQQ) ${prices.qqq ?? "unknown"}. Give the analysis as JSON.`,
      },
    ],
    output: Output.object({ schema: analysisSchema }),
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  const object = await result.experimental_partialOutputStream
    .pipeTo(new WritableStream({ write() {} }))
    .then(() => result.output);
  return { ...object, generatedAt: new Date().toISOString() };
}
