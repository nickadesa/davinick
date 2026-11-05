<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Rules
- Signal scoring lives in `src/lib/signals.ts` as pure functions (tested in `signals.test.ts`) — keeps analysis logic independent of the UI and the future news data source.
- News events come from the free Forex Factory weekly feed (`src/lib/market.server.ts`); actuals are auto-filled from FRED (`src/lib/fred.ts` maps titles to series, needs `FRED_API_KEY`) and saved to `event_actuals`, with passcode manual entry as fallback — the free feed has no actuals.
- Signal history rows are written server-side when an actual is saved (1h/4h follow-up prices are filled by `getHistory`, kept for the data even though no page shows it) — avoids a cron job and stays within free API limits.
- AI analysis lives in `src/lib/ai.server.ts` (Lovable AI Gateway, structured output), stored in the `ai_analysis` singleton row; it auto-regenerates 24h and 15min before the next red-news event (`aiRefreshPlan` in `signals.ts`) and the home page polls every minute — avoids AI calls on days without news.
- The site is gold (XAUUSD) only; Nasdaq was removed at the user's request. Old NASDAQ rows in `signal_history` are filtered out, not deleted.
- Desk chart is a hand-drawn SVG candlestick (no chart library) so it renders during SSR; fib/lot-size/PnL maths are pure functions in `signals.ts`.
- `AppShell` (mounted once in `__root.tsx`) is the only navigation chrome: collapsible left sidebar on desktop (state in localStorage), left drawer on mobile, top bar with notifications and profile — pages render content only.
- Journal is guest-mode: trades live in localStorage (`src/lib/journal.ts`, pure maths tested in `journal.test.ts`) — no sign-in needed.
- Shared UI pieces (`NextReleaseCard`, `SignalSummaryCard`, `NewsRow`/`NewsList`) live in `src/components` and are reused across Home and Calendar — one visual language per signal/news element.
- No bottom tab bar; `/history` redirects to `/` (page removed at the user's request); `signal_history` rows are still written so the data stays available.
- Official BoardUI source is isolated under `src/boardui`; use its controls with host semantic-token overrides and no template sample data, so provenance is retained without overwriting legacy controls. Pro blocks require licensed source, never lookalikes.
