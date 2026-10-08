import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { tradePnl } from "./signals";
import { publicDb } from "./market.server";

type Row = {
  id: string; user_id: string; author_name: string; direction: string; entry_price: number; exit_price: number;
  lots: number; note: string; screenshot_path: string | null; status: string; created_at: string;
};

async function withImages(rows: Row[]) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return Promise.all(
    rows.map(async (r) => {
      const pnl = tradePnl(r.direction as "BUY" | "SELL", Number(r.entry_price), Number(r.exit_price), Number(r.lots));
      let image: string | null = null;
      if (r.screenshot_path) {
        const { data } = await supabaseAdmin.storage.from("trade-screenshots").createSignedUrl(r.screenshot_path, 3600);
        image = data?.signedUrl ?? null;
      }
      const { user_id: _u, screenshot_path: _s, ...safe } = r;
      return { ...safe, entry_price: Number(r.entry_price), exit_price: Number(r.exit_price), lots: Number(r.lots), pnl, image, uid: r.user_id };
    }),
  );
}

/** Approved community trades plus a leaderboard. Public. */
export const getCommunity = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicDb()
    .from("trade_posts")
    .select("id, user_id, author_name, direction, entry_price, exit_price, lots, note, screenshot_path, status, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) { console.error(error); return { posts: [], leaders: [], error: "Couldn't load the community feed." }; }
  const posts = await withImages((data ?? []) as Row[]);
  const by = new Map<string, { name: string; trades: number; wins: number; pnl: number }>();
  for (const p of posts) {
    const l = by.get(p.uid) ?? { name: p.author_name, trades: 0, wins: 0, pnl: 0 };
    l.trades++; if (p.pnl > 0) l.wins++; l.pnl += p.pnl;
    by.set(p.uid, l);
  }
  const leaders = [...by.values()]
    .map((l) => ({ ...l, pnl: Math.round(l.pnl * 100) / 100, rate: Math.round((l.wins / l.trades) * 100) }))
    .sort((a, b) => b.pnl - a.pnl)
    .slice(0, 10);
  return { posts: posts.slice(0, 60).map(({ uid: _u, ...p }) => p), leaders, error: null as string | null };
});

const pass = z.string().min(1).max(200);
function checkPass(p: string) {
  const expected = process.env["ADMIN_PASSCODE"];
  return !!expected && p === expected;
}

/** Pending posts for the owner to review (admin passcode). */
export const getPending = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ passcode: pass }).parse(d))
  .handler(async ({ data }) => {
    if (!checkPass(data.passcode)) return { ok: false, posts: [], error: "Wrong passcode" };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin.from("trade_posts").select("*").eq("status", "pending").order("created_at").limit(100);
    const posts = (await withImages((rows ?? []) as Row[])).map(({ uid: _u, ...p }) => p);
    return { ok: true, posts, error: null as string | null };
  });

export const moderatePost = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ passcode: pass, id: z.string().uuid(), status: z.enum(["approved", "rejected"]) }).parse(d))
  .handler(async ({ data }) => {
    if (!checkPass(data.passcode)) return { ok: false, error: "Wrong passcode" };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("trade_posts").update({ status: data.status }).eq("id", data.id);
    return { ok: !error, error: error ? "Couldn't update" : null };
  });
