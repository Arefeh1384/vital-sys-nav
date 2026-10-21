# Supply & Pharmacy Shortage Risk Frontend Workflow

## Implemented

- Added a Supply workspace entry to the existing HIM-OS navigation and reused the existing `WorkView` route/navigation mechanism.
- Added centralized synthetic supply fixtures for three shortage risks, lot-level inventory dispositions, forecast points, case history, and case outcomes.
- Added `/supply`, `/supply/risks/:riskId`, `/supply/recommendations`, `/supply/recommendations/new?type=replenishment|transfer&risk=:riskId`, `/supply/recommendations/:proposalId`, `/supply/cases`, and `/supply/cases/:caseId` views.
- Implemented risk search, criticality/data-quality filters, risk/stockout sorting, pagination, KPI cards, and detail tabs for overview, inventory, demand forecast, aging/expiry, assumptions/scenario, and related proposals.
- Implemented replenishment and transfer T1 draft forms, pack-rounding preview, constraint states, save, edit, revision history, withdraw, and mock validation feedback.
- Added case-to-risk/proposal navigation, case status updates and a read-only uncertain-action panel.
- Isolated proposal, case-status, and scenario override persistence in `localStorage` adapters. These are demo-only and are not secure/server-backed.
- Added explicit messaging that saved or validated proposals do not execute procurement, reserve stock, or move inventory.
- Enabled `strictNullChecks` in `tsconfig.json`, fixing the existing router type-check prerequisite.

## Demo fixture notes

All records are synthetic. The sample replenishment fixture demonstrates target stock 150, inventory position 149 (140 usable + 24 inbound - 15 outbound), and upward rounding to a pack of 12. Unknown supplier price is displayed as `قیمت نامشخص`. Forecast periods marked censored are explicitly identified as limited evidence.

## Validation

- `npm run lint -- --pretty false`: passed after enabling `strictNullChecks`.
- `vite build`: blocked by the environment's missing optional native Rolldown Linux binding (`@rolldown/binding-linux-x64-gnu`).
- Vitest suite: could not start for the same missing native Rolldown binding.
- Browser end-to-end journeys were not run in this environment.

## Known gaps / non-production behavior

- All supply records and calculations are synthetic; no backend or external inventory/procurement system is contacted.
- The scenario override is stored as demo metadata; it does not replace the source fixture or claim to update a live forecast.
- The follow-up Task action explicitly defers to the shared Tasks subsystem rather than creating a second disconnected task implementation.
- Cross-site authorization is represented only as UI guidance; no real authorization is implemented.
- Full end-to-end browser acceptance remains outstanding because the build/test runner could not start in this environment.
