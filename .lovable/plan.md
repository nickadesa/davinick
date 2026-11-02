# TOPTIERclub redesign (unslop pass)

English copy only. Existing features, data logic and routes stay. No Telegram button, no win rate, no pricing, paywall, payment or rewards. Every number on the site comes from this site's own data.

## Direction
- Product: a gold (XAUUSD) desk that turns high-impact USD news into a scored bias before and after release
- Character: precise, calm, a little warm
- World: bullion and a late-night trading terminal
- Moments: the "Next release" card on Home and the results line on History
- Signature: one small status dot next to the next release. It pulses only when that release is within 60 minutes

## Look and feel
- Warm neutral dark theme. Gold is the only accent
- Green and red appear only on BUY/SELL words and profit/loss figures
- Sentence-case labels, no emoji, no exclamation marks, tabular numbers
- One entrance animation on page load. No other looping motion
- Spacing on a 4px grid, quiet hairline borders, nested corner radii

## Home page section flow (follows the reference site's order)
1. Hero: short headline about what the desk does, with the "Next release" card as the main visual. The card has a large countdown, the forecast and previous values, and a gold bar that fills as the release gets closer
2. Three steps: "News is released", "Figure is scored against forecast", "Bias and confidence are published". Plain text, no icons for decoration
3. Results: the current signal as one summary card (large BUY, SELL or NEUTRAL, confidence, one reason line), then the AI desk analysis and pre-release calls (still showing 4 at first, with "Show more"). Below that, the red-news list for this week and the what-if lab
4. FAQ: a short accordion with honest answers (where the news comes from, how confidence is worked out, why confidence never reaches 100%, when the AI re-analyses, not financial advice)
5. Closing call-to-action: one line and one button to the Desk page, with a quiet link to History

## Calendar page (new)
A page for the mobile tab bar that shows this week's red-news list (same rows and data as Home), so "Calendar" has its own page.

## History page
- The signal count above a single results line: cumulative gold result in gold, a grey reference line beside it (gold price change over the same period)
- The detailed table stays below the chart
- No win rate anywhere

## Desk and Profile
- Desk gets the same signal summary card style; chart, fib levels, playbook, lot calculator and killzones stay
- Profile gains a list of links that no longer fit in the mobile tab bar (theme switch and any other pages)

## Navigation
- Desktop: the existing top dropdown menu stays, adding Calendar and History
- Mobile: bottom tab bar with Home, Calendar, History, Desk and Profile. The top menu button hides on mobile

## Copy clean-up
Remove any claim that cannot be checked. Keep the "educational, not financial advice" note in the footer.

## Technical details
- Tokens in `src/styles.css`: warm neutral ramp, `--gold` as only accent, `--bull`/`--bear` kept for direction words and PnL only
- New shared components: `NextReleaseCard`, `SignalSummaryCard`, `ResultsLine` (hand-drawn SVG, renders during SSR like the desk chart), `Faq` using the existing accordion
- New route `src/routes/calendar.tsx` reusing the calendar query; news row extracted from `index.tsx` into a shared component
- Cumulative result line built from existing `signal_history` 4h outcomes (XAUUSD only); reference line from the stored entry prices
- `BottomNav.tsx` updated to five tabs; `SiteNav` adds the new pages
- Status dot pulse driven by minutes-to-next-release, under 60 only
- Head metadata for the new route; AGENTS.md updated for the shared components and calendar route
