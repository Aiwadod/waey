# Gemini Instructions for Waey

Follow `AGENTS.md` as the source of project rules. The installed skill inventory is documented in `docs/agents/skills.md`.

Use the same project constraints as other agents:

- Keep Waey as a client-side Vite + React app unless a backend is explicitly requested.
- Preserve hash routing and reload-safe local session behavior.
- Use `VITE_AI_ENDPOINT` for optional AI calls; never expose vendor keys in browser code.
- Run `npm run check` before claiming app changes are complete.

For animation or interaction work, start with `emil-design-eng`, `mass-landing-page`, `bmad-agent-ux-designer`, `bmad-create-ux-design`, and `prototype`.
