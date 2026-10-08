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
- News events come from `src/lib/news-data.ts` (sample data) — swap for a live calendar feed without touching components.
