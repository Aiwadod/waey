# Domain Docs

Waey uses a single-context documentation layout.

## Read Order

1. `AGENTS.md`
2. `CONTEXT.md`
3. `docs/agents/*.md`
4. `docs/adr/*.md`, if the directory exists later
5. Source and tests relevant to the task

## Rules

- Treat `CONTEXT.md` as the current domain glossary and product boundary.
- Add ADRs under `docs/adr/` only for durable architectural choices.
- Keep repo-specific agent configuration in `docs/agents/`.
- If this becomes a monorepo, add `CONTEXT-MAP.md` and update this file.
