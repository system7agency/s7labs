# Mini-apps design-system migration — status tracker

Source of truth for which apps have been reviewed + approved in the
design-system canonicalization (the "website-roast treatment"). The app's
`status` in `src/app/mini-apps/_data/apps.ts` mirrors this:

- **`live`** = reviewed, approved, done.
- **`draft`** = not yet reviewed. App still works/launches; the marketplace card
  shows an amber DRAFT badge so done-vs-not is visible at a glance.

Flip an app to `live` (here AND in `apps.ts`) only after it passes the full
audit (idle / loading / result / error states, spacing, export PNG+PDF) and you
approve it. Reference checklist: `docs/mini-apps-canonical-checklist.md`.

| # | App | Status | Notes |
|---|-----|--------|-------|
| — | **website-roast** | ✅ live | pill buttons, sans inputs, spacing, centered export, multi-page PDF — approved |
| — | **agentic-readiness** | ✅ live | full audit done; export now captures gated breakdown (3-page PDF) — approved |
| 1 | ai-overview-tracker | ⬜ draft | partial (batch 1): footer/token/loading done; needs input-strip + spacing + export-ref check |
| 2 | ai-visibility-score | ⬜ draft | partial (batch 1): footer/token/loading done; needs input-strip + spacing |
| 3 | email-copy-optimizer | ⬜ draft | partial (batch 1): ExportControls added; needs input-strip + spacing |
| 4 | roi-calculator | ⬜ draft | tokens converged; needs full treatment |
| 5 | tech-stack-finder | ⬜ draft | tokens converged; needs full treatment |
| 6 | bulk-email-finder | ⬜ draft | OUTLIER — off-brand (sans labels, plain buttons); biggest lift |
| 7 | campaign-ideation | ⬜ draft | needs ExportControls + full treatment |
| 8 | crm-sanity | ⬜ draft | has ExportControls; needs input-strip + spacing |
| 9 | job-brief | ⬜ draft | has ExportControls; needs input-strip + spacing |
| 10 | linkedin-hook | ⬜ draft | has ExportControls; needs input-strip + spacing |
| 11 | outbound-radar | ⬜ draft | has ExportControls; needs input-strip + spacing |
| 12 | proposal-engine | ⬜ draft | has ExportControls; needs input-strip + spacing |
| 13 | share-of-voice | ⬜ draft | gated breakdown — CHECK export-ref scope (likely same bug as agentic) |
| 14 | tech-stack-recommender | ⬜ draft | has ExportControls; needs input-strip + spacing |
| 15 | automation-blueprint | ⬜ draft | has ExportControls; needs input-strip + spacing |
| 16 | gtm-flywheel | ⬜ draft | gated export panel; own How-It-Works; needs full treatment |
| 17 | intent-signals | ⬜ draft | needs ExportControls + full treatment |
| 18 | linkedin-profile-reviewer | ⬜ draft | needs ExportControls + full treatment |
| 19 | email-finder | ⬜ draft | combined search-bar input (keep structural); killswitched |
| 20 | find-people | ⬜ draft | killswitched; needs full treatment |
| 21 | pricing-diagnostic | ⬜ draft | the original pilot; own inline How-It-Works to migrate |

**Done: 2 / 23.** Update this table + `apps.ts` status together as each is approved.
