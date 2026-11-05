# TOPTIERclub redesign

- [x] Obtain approval for the complete redesign plan and public BoardUI component inventory.
- [x] Acquire public BoardUI sources in an isolated namespace.
- [ ] Acquire Pro Earnings Chart and Bar List sources — blocked on licensed owner source/access.
- [ ] Unify typography, sky tokens, spacing and optional Glisse glass settings.
- [ ] Update shell, Home, economic calendar, notification center, Profile and settings.
- [ ] Upgrade Journal calendar, earnings/stats, add-trade drawer and validated Tradovate import.
- [ ] Add Claude image extraction and single-conversation assistant with reviewed analysis commands.
- [ ] Update Desk instrument search and killzones; preserve or restore lot calculator.
- [ ] Verify mobile/desktop, existing data, imports, real AI responses and business-rule tests.

Current checkpoint: DM Sans replaces mono figures; sky theme overrides imported; real BoardUI navigation rows, Settings Modal and Notification Center connected; circular Profile; Glisse source retained with license and optional presets wired. Settings and Notification Center opened in browser; mobile Journal has no overflow; 19 existing maths tests pass and latest harness entry is build OK.

Pending work not yet delivered: Home/analysis split (analysis currently reuses Home), larger Journal/add-trade drawer/import/extraction, complete settings persistence behaviors, earnings/stats/filters, Desk search/lot calculator/killzones, authenticated Claude chat and full verification. External prerequisites: Pro source, Tradovate sample, securely supplied Anthropic key. No claim that these remaining items are complete.