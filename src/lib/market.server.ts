import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { classifyEvent, parseFigure, type NewsEvent } from "./signals";

const FEED = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
export const PRICE_SYMBOLS = { XAUUSD: "XAU/USD" } as const;

interface FFEvent { title: string; country: string; date: string; impact: string; forecast: string; previous: string }

export function publicDb() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export function eventKey(title: string, iso: string) {
  return `${iso.slice(0, 16)}|${title}`;
}

/** Real USD red-folder events for this week, merged with actual figures saved in the database. */
/** The free feed rate-limits hard, so keep one shared copy and refresh it at most every 15 minutes. */
async function fetchFeed(): Promise<FFEvent[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: cached } = await supabaseAdmin.from("calendar_cache").select("payload, fetched_at").eq("id", 1).maybeSingle();
  const fresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < 15 * 60e3;
  if (cached && fresh) return cached.payload as unknown as FFEvent[];
  const res = await fetch(FEED, { headers: { "User-Agent": "RedBox/1.0" } });
  if (!res.ok) {
    if (cached) return cached.payload as unknown as FFEvent[];
    throw new Error(`Calendar feed failed [${res.status}]`);
  }
  const raw = (await res.json()) as FFEvent[];
  await supabaseAdmin.from("calendar_cache").upsert({ id: 1, payload: raw as never, fetched_at: new Date().toISOString() });
  return raw;
}

export async function loadCalendar(): Promise<NewsEvent[]> {
  const raw = await fetchFeed();
  const { data: actuals } = await publicDb().from("event_actuals").select("event_key, actual");
  const map = new Map((actuals ?? []).map((a) => [a.event_key, Number(a.actual)]));

  return raw
    .filter((e) => e.impact === "High" && e.country === "USD")
    .map((e) => {
      const time = new Date(e.date).toISOString();
      const f = parseFigure(e.forecast);
      const p = parseFigure(e.previous);
      const id = eventKey(e.title, time);
      return {
        id, time, title: e.title, currency: e.country,
        actual: map.get(id) ?? null,
        forecast: f.value, previous: p.value, unit: f.unit || p.unit,
        ...classifyEvent(e.title),
      };
    })
    .sort((a, b) => a.time.localeCompare(b.time));
}

function tdKey() {
  const k = process.env["TWELVE_DATA_API_KEY"];
  if (!k) throw new Error("TWELVE_DATA_API_KEY missing");
  return k;
}

export async function currentPrice(symbol: string): Promise<number | null> {
  const r = await fetch(`https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbol)}&apikey=${tdKey()}`);
  const j = (await r.json()) as { price?: string; message?: string };
  if (!j.price) { console.error("Twelve Data price error", j.message); return null; }
  return Number(j.price);
}

/** Close of the first 5-minute bar at/after the given time. */
export async function priceAt(symbol: string, at: Date): Promise<number | null> {
  const fmt = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");
  const end = new Date(at.getTime() + 60 * 60 * 1000);
  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=5min&timezone=UTC&order=ASC&outputsize=1&start_date=${encodeURIComponent(fmt(at))}&end_date=${encodeURIComponent(fmt(end))}&apikey=${tdKey()}`;
  const j = (await (await fetch(url)).json()) as { values?: { close: string }[]; message?: string };
  const first = j.values?.[0];
  if (!first) { console.error("Twelve Data series error", j.message); return null; }
  return Number(first.close);
}

export interface Candle { t: string; o: number; h: number; l: number; c: number }

/** Recent gold candles, oldest first. */
export async function goldCandles(interval: "15min" | "1h" | "4h", size = 120): Promise<Candle[]> {
  const url = `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=${interval}&timezone=UTC&outputsize=${size}&apikey=${tdKey()}`;
  const j = (await (await fetch(url)).json()) as { values?: { datetime: string; open: string; high: string; low: string; close: string }[]; message?: string };
  if (!j.values) throw new Error(`Twelve Data candles error: ${j.message}`);
  return j.values.map((v) => ({ t: v.datetime, o: +v.open, h: +v.high, l: +v.low, c: +v.close })).reverse();
}
