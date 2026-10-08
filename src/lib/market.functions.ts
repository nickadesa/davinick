import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { computeSignal, type Asset } from "./signals";
import { currentPrice, goldCandles, loadCalendar, priceAt, PRICE_SYMBOLS, publicDb } from "./market.server";
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

    // Record the new gold signal, based on red news released in the last 24h.
    const since = Date.now() - 24 * 3600 * 1000;
    const recent = events
      .map((e) => (e.id === ev.id ? { ...e, actual: data.actual } : e))
      .filter((e) => new Date(e.time).getTime() >= since && new Date(e.time) <= new Date());
    const rows = await Promise.all(
      (["XAUUSD"] as Asset[]).map(async (asset) => {
        const s = computeSignal(recent, asset);
        let entry: number | null = null;
        try { entry = await currentPrice(PRICE_SYMBOLS[asset]); } catch (e) { console.error(e); }
        return { asset, action: s.action, confidence: s.confidence, trigger_title: ev.title, entry_price: entry };
      }),
    );
    await supabaseAdmin.from("signal_history").insert(rows);
    return { ok: true, error: null as string | null };
  });

/** AI-generated analysis of this week's red news, cached for 6 hours. Pass refresh=true to regenerate. */
export const getAiAnalysis = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ refresh: z.boolean().optional() }).parse(d ?? {}))
  .handler(async ({ data }): Promise<{ analysis: AiAnalysis | null; error: string | null }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      if (!data?.refresh) {
        const { data: cached } = await supabaseAdmin.from("ai_analysis").select("payload, created_at").eq("id", 1).maybeSingle();
        if (cached && Date.now() - new Date(cached.created_at).getTime() < 6 * 3600e3) {
          return { analysis: cached.payload as unknown as AiAnalysis, error: null };
        }
      }
      const events = await loadCalendar();
      let xauusd: number | null = null;
      try { xauusd = await currentPrice(PRICE_SYMBOLS.XAUUSD); } catch (e) { console.error(e); }
      const analysis = await runAiAnalysis(events, { xauusd });
      await supabaseAdmin.from("ai_analysis").upsert({ id: 1, payload: analysis as never, created_at: new Date().toISOString() });
      return { analysis, error: null };
    } catch (e) {
      console.error(e);
      const { data: cached } = await supabaseAdmin.from("ai_analysis").select("payload").eq("id", 1).maybeSingle();
      if (cached) return { analysis: cached.payload as unknown as AiAnalysis, error: null };
      return { analysis: null, error: "AI analysis isn't available right now. Try again in a moment." };
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
