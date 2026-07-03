# Waey Context

Waey is a behavioral financial intelligence platform for university students. The prototype has three main perspectives: student, university, and bank.

## Product Shape

- Students enter the app through login or explicit guest mode.
- Universities can view a dashboard for institutional financial behavior insights.
- Banks can view a dashboard for banking and loan-related behavior.
- Current state is client-side only. Session, route, language, balance, loan, and chat state live in browser state/local storage.

## Architecture

- Runtime: Vite + React.
- Main app shell: `src/App.jsx`.
- Testable helpers: `src/lib/routing.js`, `src/lib/session.js`, `src/lib/finance.js`, `src/lib/i18n.js`, and `src/lib/ai.js`.
- Browser regression tests: `tests/e2e/waey.spec.js`.
- Static hosting uses hash routes and SPA fallback configuration.

## Constraints

- Keep direct-load and reload behavior safe for hash routes.
- Empty login must not create a session; guest mode must be explicit.
- Financial transactions must be atomic: blocked transactions leave balance and history unchanged.
- Language changes must update `lang`, `dir`, and title metadata.
- AI calls are optional and must go through `VITE_AI_ENDPOINT`.

## Terms

- Public flow: splash, landing, role selection, login, and guest entry.
- Student app: the student-facing financial workflow.
- University dashboard: institutional view reached by `#/university`.
- Bank dashboard: bank view reached by `#/bank`.
- Session: minimal local browser session state, not backend auth.
