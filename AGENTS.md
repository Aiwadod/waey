# Waey Agent Instructions

Waey is a Vite + React single page app for student financial behavior workflows. Treat it as a client-side prototype unless a backend is explicitly added.

## Working Rules

- Keep changes scoped to the existing React/Vite shape in `src/App.jsx` and `src/lib/*`.
- Preserve the hash routes: `#/landing`, `#/roles`, `#/student`, `#/university`, and `#/bank`.
- Keep auth/session behavior local-only unless a backend task is explicitly requested.
- Do not call vendor AI APIs or expose keys from the browser; use `VITE_AI_ENDPOINT` only.
- Keep Arabic/English language behavior in sync with `document.documentElement.lang`, `dir`, and the page title.
- Do not add self-credit, co-author lines, or AI attribution to commits, PRs, generated docs, or release text.
- Verify meaningful app changes with `npm run check`; use `npm run test:e2e` for browser-flow or routing changes.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues for `Aiwadod/waey`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default five-label triage vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

This repo uses a single-context domain-doc layout rooted at `CONTEXT.md`. See `docs/agents/domain.md`.

## Installed Skills

Project-local skills are installed in both `.agents/skills/` and `.claude/skills/`. The same imported skill set was also installed globally in the user skill folders for Codex-style and agent-style sessions.

Use `docs/agents/skills.md` as the skill inventory. For UI polish, motion, animation, and interaction work, prefer these first:

- `emil-design-eng`: global UI polish and animation judgment.
- `mass-landing-page`: GSAP and Framer Motion patterns from an Arabic-first Vite/React landing page; adapt motion ideas only, not MASS-specific branding or copy.
- `bmad-agent-ux-designer`: UX design perspective for flows, screens, and interaction quality.
- `bmad-create-ux-design`: structured UX specification planning.
- `prototype`: quick runnable experiments before committing to a direction.

## Verification Commands

- `npm run check`
- `npm run test:e2e`
- `npm audit --audit-level=moderate`
