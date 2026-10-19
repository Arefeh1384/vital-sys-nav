# Phase 6 Frontend Demo Implementation

This implementation is frontend-only and keeps all new records in browser localStorage (`him.phase6.memos.v1`, `him.phase6.tasks.v1`, `him.phase6.revisions.v1`). **These records are synthetic demonstration data, not secure, server-persisted, approved, or immutable.** Clearing storage will erase them. No actual purchase, order, action, or clinical decision is executed.

## Pages
- `/executive/memos`: site-scoped memo list with search/filter
- `/executive/memos/new`: memo editor
- `/executive/memos/:id`: memo detail, related tasks, revision history
- `/executive/memos/:id/edit`: saved memo editor
- `/tasks/:id`: phase-6-created task detail when ID starts `TASK-`; pre-existing task routing is retained
- `/copilot`: action bar for completed or partial answers

## Modules
- `src/him/phase6/store.ts`: typed mock adapter and fixture derivation
- `src/him/phase6/Phase6.tsx`: memo list, editor, detail, task drawer, task detail
- Existing `AppContext`, `Sidebar`, `MainContent`, `CopilotView` extended without introducing a new UI library.

## Current limitations / next improvements
- The app's existing task model has a different, smaller status taxonomy; phase-6 demo tasks are shown alongside existing tasks instead of replacing them.
- Demo authorization is site-scoped visually, not secure authorization; owners are free text, not a server-provided authorized directory.
- No immutable or backend version history; localStorage revisions are snapshots for demo only.
- Source-answer deep linking is not persisted by the existing Copilot state. The link opens Copilot, rather than a uniquely restored answer.
- The current project dependencies shipped in the ZIP do not include the native Rolldown binary for this platform; Vite build cannot run without reinstalling dependencies.

## Verification
- `node node_modules/typescript/bin/tsc --noEmit --strictNullChecks true` passed locally.
- `npm run lint` fails because the project's existing `tsconfig.json` does not enable `strictNullChecks`, which the router typings require.
- Vite bundling attempted but blocked by the ZIP's missing `@rolldown/binding-linux-x64-gnu` / WASI native dependencies.
- Browser E2E journeys were not executed in this environment.
