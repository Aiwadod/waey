# Claude Instructions for Waey

Follow `AGENTS.md` for project rules, verification commands, and repo workflow. Claude-specific skills are installed in `.claude/skills/`; the matching agent copies are in `.agents/skills/`.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues for `Aiwadod/waey`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default five-label triage vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

This repo uses a single-context domain-doc layout rooted at `CONTEXT.md`. See `docs/agents/domain.md`.

## Motion And UI Skills

For animation, motion, interaction polish, and design execution, use:

- `emil-design-eng` for UI polish, interaction feel, and animation decisions.
- `mass-landing-page` for GSAP/Framer Motion implementation patterns; keep Waey branding, content, and product behavior distinct.
- `bmad-agent-ux-designer` and `bmad-create-ux-design` for UX direction and specs.
- `prototype` when a motion or UI direction needs a quick runnable test.

See `docs/agents/skills.md` for the full installed skill inventory.
