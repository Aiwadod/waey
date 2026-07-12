# University Journey Redesign

## Scope

Replace the existing university portal navigation with three focused pages while preserving the `#/university` hash route and local-only prototype behavior. Bank portal components, copy, navigation, data, and behavior are out of scope.

## Experience

### Dashboard

Show an institution-wide overview with aggregated data only:

- participating students;
- participating colleges;
- application engagement rate;
- overall financial-awareness improvement;
- challenge completion rate; and
- completed awareness campaigns.

The first four metrics form the primary KPI row. Challenge completion and campaign count appear as supporting KPIs alongside a simple performance trend and an aggregated-data notice.

### Colleges Insights & Campaigns

Show the most financially aware college, most improved college, college with the highest participation, and the most common student financial challenge. Include a college comparison and a campaign workspace.

University users can create a campaign by entering a name and choosing a college. New campaigns remain local to the current portal session. Each campaign shows participant count, completion rate, engagement impact, and financial-awareness impact. The creation form rejects an empty campaign name.

### Reports

Allow monthly or semester report selection. Show KPI summaries and initiative impact in a report-ready layout. Excel export reuses the existing client-side workbook download helper. PDF export uses a print-optimized report view and the browser print dialog, where the user can save as PDF without adding a new dependency.

## Architecture

Keep university UI composition in `src/App.jsx`, following the existing single-file application shape. Move stable university dashboard data, campaign creation, period selection, and export-row construction into `src/lib/university.js` so it can be unit tested independently. Add `src/lib/university.test.js` before production implementation.

University navigation will use the existing `RoleShell`, but it will pass exactly three university-only items. No shared `RoleShell` behavior and no `BankDash*` component will be changed.

## Language and Privacy

All new labels and data names have Arabic and English variants. Existing application language handling continues to control `lang`, `dir`, and the document title. Every university page displays an aggregated and anonymized data notice. No student names, identifiers, or individual records are introduced.

## Validation and Failure Behavior

Campaign creation keeps the form open and shows an inline localized validation message when the name is blank. Export controls operate only on static aggregated report data. The print action does not mutate application state.

## Verification

- Unit tests cover localized data selection, report-period selection, campaign creation validation, immutable campaign insertion, and report export rows.
- `npm run check` verifies the full unit suite and production build.
- `npm run test:e2e` verifies existing routing and browser flows remain intact.
- A final diff audit checks that bank-specific component sections and behavior were not modified.
