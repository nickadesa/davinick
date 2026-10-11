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
- News events come from the free Forex Factory weekly feed (`src/lib/market.server.ts`); actual figures are entered manually behind a passcode and stored in `event_actuals` — the free feed has no actuals.
- Signal history rows are written server-side when an actual is saved; 1h/4h follow-up prices are filled lazily on history page load (Twelve Data, gold only) — avoids a cron job and stays within free API limits.
- AI analysis lives in `src/lib/ai.server.ts` (Lovable AI Gateway, `openai/gpt-6-astra` via Responses, structured output); results are cached in the `ai_analysis` singleton row for 6h and regenerated on demand via `getAiAnalysis({ refresh: true })`.
- The site is gold (XAUUSD) only; Nasdaq was removed at the user's request. Old NASDAQ rows in `signal_history` are filtered out, not deleted.
- Desk chart is a hand-drawn SVG candlestick (no chart library) so it renders during SSR; fib/lot-size/PnL maths are pure functions in `signals.ts`.
- All content pages share `SiteNav` with a Radix dropdown and pathname-based active links — keeps navigation consistent and keyboard-accessible on desktop and mobile.
