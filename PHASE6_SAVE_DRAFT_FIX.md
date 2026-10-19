# Phase 6 — Save Draft navigation guard fix

## Reproduced from source
The `save` callback called `setDirty(false)` and immediately called `openWorkView({kind:'memo-edit', id:result.id})`. React state changes are asynchronous, so the currently installed `him:before-navigation` listener still closed over `dirty === true`. `openWorkView` synchronously dispatched the cancelable event and displayed an unintended native confirmation. Canceling that prompt prevented the route change even though the memo had already been persisted.

## Focused fix
`Phase6.tsx` uses `bypassSaveNavigationGuard` (`useRef`) only around the synchronous navigation that follows successful `demoStore.saveMemo`. The normal guard remains active for sidebar changes, Back, and other user-initiated navigation while the editor is dirty. The bypass is reset in `finally`, even if the routing action throws. The success toast is emitted only after the storage operation succeeds.

## Verification
- `node node_modules/typescript/bin/tsc --noEmit --strictNullChecks --pretty false`: PASS.
- Code-path review: save attempts validate first, persist, then bypass only the save-owned navigation; failed save never enables bypass.
- Browser/E2E test of the deployed website was not run here.

## Remaining work beyond this bug
Legacy tasks still use the old `WorkTask` status model (`open`, `in_progress`, `done`), unlike Phase 6 demo tasks. Task title/description editing and independent review approval/rejection also remain incomplete. They require their own unified task-model migration and acceptance tests; this patch does not claim to resolve them.
