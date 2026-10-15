import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { NewsEvent } from "./signals";

const analysisSchema = z.object({
  outlook: z.string().describe("2-3 sentence weekly outlook for gold based on this week's high-impact USD events"),
  xauusd: z.object({
    action: z.enum(["BUY", "SELL", "NEUTRAL"]),
    confidence: z.number().describe("50-95"),
    reasoning: z.string().describe("1-2 sentences"),
    entry: z.number().nullable(),
    stopLoss: z.number().nullable(),
    takeProfit: z.number().nullable(),
  }),
  events: z.array(
    z.object({
      title: z.string(),
      time: z.string().describe("event time as given, e.g. 2026-10-14T12:30"),
      released: z.boolean(),
      bias: z.enum(["bullish", "bearish", "neutral"]).describe("expected gold bias going into / after the release"),
      signal: z.enum(["BUY", "SELL", "NEUTRAL"]).describe("pre-release gold signal"),
      confidence: z.number().describe("50-95"),
      note: z.string().describe("one short sentence: what the market expects and why"),
      ifBeat: z.string().describe("short: gold reaction if US data beats forecast"),
      ifMiss: z.string().describe("short: gold reaction if US data misses forecast"),
    }),
  ),
});

export type AiAnalysis = z.infer<typeof analysisSchema> & { generatedAt: string };

/** Ask the AI to analyse this week's red-folder USD events and produce signals for gold. */
export async function runAiAnalysis(events: NewsEvent[], prices: { xauusd: number | null }): Promise<AiAnalysis> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");

  const provider = createOpenAI({
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    apiKey,
  });

  const eventLines = events
    .map(
      (e) =>
        `- ${e.time.slice(0, 16)}Z | ${e.title} | forecast: ${e.forecast ?? "n/a"}${e.unit} | previous: ${e.previous ?? "n/a"}${e.unit} | actual: ${e.actual ?? "not released"}`,
    )
    .join("\n");

  const result = await generateText({
    model: provider.chat("gemini-2.0-flash"),
    system:
      "You are a macro trading analyst. Analyse high-impact US economic events and give directional signals for XAUUSD (gold). Stronger-than-expected US data usually lifts the dollar and yields, pressuring gold; weak data does the opposite. Confidence is 50-95, never 100. Suggest entry, stop loss and take profit levels near the current price given; where useful, place entries at the 61.8% or 78.6% Fibonacci retracement of the latest swing, with roughly 1:2 risk-reward; use null when the action is NEUTRAL. For EVERY event in the list (especially ones not yet released) give a pre-release call: read forecast vs previous, recent trend and market positioning to predict whether the figure is likely to beat or miss, then give the expected gold bias, a BUY/SELL/NEUTRAL signal with confidence, and what happens to gold if it beats or misses. Pre-release confidence should usually stay 50-70 since the number is unknown. Keep every text field short. Always respond with valid JSON matching the required schema.",
    messages: [
      {
        role: "user",
        content: `Now: ${new Date().toISOString().slice(0, 16)}Z\nThis week's high-impact USD events:\n${eventLines || "(none)"}\n\nCurrent XAUUSD price: ${prices.xauusd ?? "unknown"}. Give the analysis as JSON.`,
      },
    ],
    output: Output.object({ schema: analysisSchema }),
  });

  const object = result.output;
  if (!object) throw new Error("AI returned no structured output");

  const clamp = (n: number) => Math.round(Math.min(95, Math.max(50, n)));
  object.xauusd.confidence = clamp(object.xauusd.confidence);
  object.events = object.events.map((e) => ({ ...e, confidence: clamp(e.confidence) }));
  return { ...object, generatedAt: new Date().toISOString() };
}
