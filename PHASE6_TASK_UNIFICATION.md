# Phase 6 task unification (demo-only)

## Root cause
`MainContent` sent legacy `tk-*` tasks to `TaskDetailView` (three states from `workData.ts`), while `TASK-*` Phase 6 tasks used a separate seven-state `Phase6View`. The latter lacked title/description editing and reviewer approval/rejection controls.

## Focused changes
- `src/him/components/MainContent.tsx`: use a single task-detail route and a single task list.
- `src/him/components/WorkViews.tsx`: show legacy and Phase 6 tasks in one list and expose all seven filters.
- `src/him/phase6/Phase6.tsx`: project legacy data into the Phase 6 model while retaining IDs, evidence alert IDs and activity history. Persist modifications as overrides under the same legacy ID in `him.phase6.tasks.v1`. Add title/description save, reviewer approve/reject actions and guards against bypassing review for review-required tasks.

## Review semantics
For this frontend-only mock, review approval marks a submitted task completed; rejection returns it to in-progress. Both record events. No authentication, role permissions, real verification or backend audit trail is implied.

## Verification
`tsc --noEmit --strictNullChecks` passed using the supplied dependency tree. Standard `tsc --noEmit` still reports the pre-existing TanStack Router strict-null-checks configuration requirement in `src/router.tsx`. Browser end-to-end tests were not executed; test creation/editing/review and reload after installing dependencies in a normal environment.
