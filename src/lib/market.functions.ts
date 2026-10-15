import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { computeSignal, aiRefreshPlan, type Asset, type AiStage } from "./signals";
import { currentPrice, goldCandles, recordSignal, loadCalendar, priceAt, PRICE_SYMBOLS, publicDb } from "./market.server";
import { runAiAnalysis, type AiAnalysis } from "./ai.server";

export const getCalendar = createServerFn({ method: "GET" }).handler(async () => {
  try {
    return { events: await loadCalendar(), error: null as string | null };
  } catch (e) {
    console.error(e);
    return { events: [], error: "Couldn't load the economic calendar right now." };
  }
});

export const saveActual = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ eventKey: z.string().min(1).max(300), actual: z.number().finite(), passcode: z.string().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const expected = process.env["ADMIN_PASSCODE"];
    if (!expected || data.passcode !== expected) return { ok: false, error: "Wrong passcode" };

    const events = await loadCalendar();
    const ev = events.find((e) => e.id === data.eventKey);
    if (!ev) return { ok: false, error: "Event not found in this week's calendar" };
    if (new Date(ev.time) > new Date()) return { ok: false, error: "This event hasn't been released yet" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("event_actuals").upsert({
      event_key: ev.id, title: ev.title, event_time: ev.time, actual: data.actual, updated_at: new Date().toISOString(),
    });
    if (error) { console.error(error); return { ok: false, error: "Couldn't save" }; }

    await recordSignal(events.map((e) => (e.id === ev.id ? { ...e, actual: data.actual } : e)), ev.title);
    return { ok: true, error: null as string | null };
  });

/** AI analysis of red news. Auto-regenerates twice per event: 24h before and 15 min before release. refresh=true forces it. */
export const getAiAnalysis = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ refresh: z.boolean().optional() }).parse(d ?? {}))
  .handler(async ({ data }): Promise<{ analysis: AiAnalysis | null; error: string | null; stage: AiStage }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let stage: AiStage = null;
    try {
      const events = await loadCalendar();
      const { data: cached } = await supabaseAdmin.from("ai_analysis").select("payload, created_at").eq("id", 1).maybeSingle();
      const plan = aiRefreshPlan(events.map((e) => e.time), cached ? new Date(cached.created_at).getTime() : null, Date.now());
      stage = plan.stage;
      if (!data?.refresh && !plan.refresh && cached) {
        return { analysis: cached.payload as unknown as AiAnalysis, error: null, stage };
      }
      let xauusd: number | null = null;
      try { xauusd = await currentPrice(PRICE_SYMBOLS.XAUUSD); } catch (e) { console.error(e); }
      const analysis = await runAiAnalysis(events, { xauusd });
      await supabaseAdmin.from("ai_analysis").upsert({ id: 1, payload: analysis as never, created_at: new Date().toISOString() });
      return { analysis, error: null, stage };
    } catch (e) {
      console.error(e);
      const { data: cached } = await supabaseAdmin.from("ai_analysis").select("payload").eq("id", 1).maybeSingle();
      if (cached) return { analysis: cached.payload as unknown as AiAnalysis, error: null, stage };
      const msg = e instanceof Error ? e.message : String(e);
      return { stage, analysis: null, error: `AI error: ${msg.slice(0, 180)}` };
    }
  });

export const getHistory = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicDb()
    .from("signal_history")
    .select("id, asset, action, confidence, trigger_title, created_at, entry_price, price_1h, price_4h")
    .eq("asset", "XAUUSD")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) { console.error(error); return { rows: [], error: "Couldn't load history" }; }
  const rows = data ?? [];

  // Fill in follow-up prices once 1h / 4h have passed (a few per load to stay within API limits).
  const now = Date.now();
  const todo = rows.filter((r) => {
    const t = new Date(r.created_at).getTime();
    return (r.price_1h === null && now - t > 3600e3) || (r.price_4h === null && now - t > 4 * 3600e3);
  }).slice(0, 4);
  if (todo.length && process.env["TWELVE_DATA_API_KEY"]) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (const r of todo) {
      const sym = PRICE_SYMBOLS[r.asset as Asset];
      const t = new Date(r.created_at).getTime();
      const patch: { price_1h?: number; price_4h?: number } = {};
      try {
        if (r.price_1h === null && now - t > 3600e3) {
          const p = await priceAt(sym, new Date(t + 3600e3)); if (p !== null) patch.price_1h = p;
        }
        if (r.price_4h === null && now - t > 4 * 3600e3) {
          const p = await priceAt(sym, new Date(t + 4 * 3600e3)); if (p !== null) patch.price_4h = p;
        }
      } catch (e) { console.error(e); }
      if (Object.keys(patch).length) {
        await supabaseAdmin.from("signal_history").update(patch).eq("id", r.id);
        Object.assign(r, patch);
      }
    }
  }
  return { rows, error: null as string | null };
});

export const getCandles = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ interval: z.enum(["15min", "1h", "4h"]) }).parse(d))
  .handler(async ({ data }) => {
    try {
      return { candles: await goldCandles(data.interval), error: null as string | null };
    } catch (e) {
      console.error(e);
      return { candles: [], error: "Gold prices aren't available right now." };
    }
  });
