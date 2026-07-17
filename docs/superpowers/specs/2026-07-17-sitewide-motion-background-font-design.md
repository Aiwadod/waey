# Site-wide Motion, Background, and Font Design

## Goal

Extend Waey’s hero flow-field visual language and motion system across every top-level experience, and enforce IBM Plex Sans Arabic as the only website font family.

## Background system

- Create a reusable background-layer component around the existing `WaeyFlowField`.
- Place it behind the student app shell, public marketing/legal/login pages, institutional login, and dashboard shells.
- Reuse the existing theme-aware colors and finite GSAP animation; do not add infinite unbounded motion.
- Keep content surfaces readable by retaining opaque and translucent card backgrounds above the field.

## Motion system

- Add a reusable page-motion wrapper for enter transitions and staggered direct-child reveals.
- Apply it to student tabs, institutional dashboard content, public pages, and overlay pages.
- Add global button/card hover lift and press feedback through opt-in semantic classes or safe shell-level selectors.
- Preserve existing chart, navigation-pill, sheet, toast, and route animations.
- Respect `prefers-reduced-motion`: ambient drift settles, reveals become immediate, and hover/press transforms are disabled.

## Typography

- Keep the existing Google Fonts request for IBM Plex Sans Arabic weights 300–700.
- Set IBM Plex Sans Arabic on `html`, `body`, `#root`, buttons, inputs, selects, textareas, and SVG text inheritance.
- Keep `system-ui` and `sans-serif` only as loading fallbacks.

## Verification

- Add contract tests for global font coverage and background/motion shell coverage.
- Extend browser checks to confirm the flow field appears on public, student, and institutional routes.
- Run `npm run check` and the complete Playwright suite.
