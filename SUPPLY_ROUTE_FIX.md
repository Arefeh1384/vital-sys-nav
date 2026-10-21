# Supply route rendering fix

## Root cause
`workViewForPath` already matched `/supply` and its nested risk, recommendation and case URLs, but `MainContent` returned the work-view branch without rendering `SupplyViews` for any Supply kind. Only the `activeModule === 'SUP'` dashboard branch rendered Supply content. Thus nested Supply URLs produced a blank `<main>`.

## Fix
Render `SupplyViews` for all seven Supply work-view variants inside the existing `workView` branch. Keep the existing scope, navigation, and notification adapters. Supply module dashboard rendering remains unchanged. No other HIM-OS modules modified.

## Verification
Static route coverage checked for all seven Supply work-view variants. Production build and browser end-to-end tests were not completed in this environment; verify after dependency installation. This fixes the confirmed routing regression, but does not claim the full Supply specification (fixtures A–H, forecasting, versioning, etc.) is complete.

## Smoke-test URLs
- `/supply`
- `/supply/risks/RISK-1001`
- `/supply/recommendations`
- `/supply/recommendations/new?type=replenishment&risk=RISK-1001`
- `/supply/recommendations/new?type=transfer&risk=RISK-1001`
- `/supply/cases`
- `/supply/cases/CASE-1001` (confirm actual seeded case ID)
