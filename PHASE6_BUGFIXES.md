# Phase 6 focused bug fixes

1. **Total-bed occupancy source:** `src/him/data/copilotData.ts` incorrectly attached an ICU/OPS task link to the computed 80/100 total-bed occupancy metric. It now uses a distinct `metric` link; `CopilotView.tsx` opens an inline metric-source record using the evidence's own numerator, denominator, version, and timestamp rather than opening an ICU task. Other task/alert/document source links are unchanged.
2. **Unsaved edits:** `Phase6View` previously only guarded its own `go()` buttons and `beforeunload`; sidebar used `AppContext.openWorkView` and bypassed the guard. The editor now registers a cancelable navigation guard, and `openWorkView`, module navigation, and browser history dispatch it. Declining keeps the editor and edits intact.
3. **Memo original answer:** Memo detail now navigates to `/copilot?answer=<answerId>` instead of `/copilot`. The Copilot view resolves the persisted answer ID to its original conversation turn and selects it.
4. **Direct-created task original answer:** The task detail uses the same answer-aware route, with source identity preserved across page refresh via persisted demo task and Copilot history.

## Verification
- `node node_modules/typescript/bin/tsc --noEmit --strictNullChecks true`: **passed**.
- Two targeted regression test cases were appended to `src/test/copilot.test.ts` for evidence source identity and answer-aware routing.
- Vitest and Vite production build **could not start** in this runtime: bundled Rolldown dependency is missing `rolldown-binding.linux-x64-gnu.node`.
- End-to-end browser behavior on the hosted Lovable instance was **not verified**; no deployment was made.
