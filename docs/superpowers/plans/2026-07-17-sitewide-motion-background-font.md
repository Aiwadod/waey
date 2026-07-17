# Site-wide Motion, Background, and Font Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply Waey’s flow-field background, layered motion, and IBM Plex Sans Arabic typography consistently across every top-level page.

**Architecture:** Add reusable `AmbientBackdrop` and `MotionPage` components under `src/components/motion/`. Compose them into the existing page shells in `src/App.jsx`, and centralize global typography and safe micro-interactions in `src/styles/waey-theme.css`.

**Tech Stack:** React 18, Framer Motion, GSAP, Vite, Vitest, Playwright

---

### Task 1: Lock the visual-system contract

**Files:**
- Create: `src/lib/sitewideVisuals.test.js`
- Modify: `tests/e2e/waey.spec.js`

- [x] **Step 1: Add failing contract tests**

Assert that the theme stylesheet applies IBM Plex Sans Arabic to document and form controls, and that `AmbientBackdrop` and `MotionPage` modules exist with stable data hooks.

- [x] **Step 2: Add a failing browser-flow test**

Enter the public landing page, student app, and university portal and assert that `[data-waey-backdrop]` exists. Assert the student content exposes `[data-waey-motion-page]`.

- [x] **Step 3: Run focused tests and confirm failure**

Run `npm.cmd run test:unit -- src/lib/sitewideVisuals.test.js` and `npm.cmd run test:e2e -- --grep "sitewide visual system" --reporter=line`.

Expected: both fail because the shared components and hooks do not exist.

### Task 2: Implement shared background, motion, and font primitives

**Files:**
- Create: `src/components/motion/AmbientBackdrop.jsx`
- Create: `src/components/motion/MotionPage.jsx`
- Modify: `src/styles/waey-theme.css`

- [x] **Step 1: Implement `AmbientBackdrop`**

Render the existing `WaeyFlowField` inside a non-interactive absolute layer with `data-waey-backdrop`.

- [x] **Step 2: Implement `MotionPage`**

Use Framer Motion for page entrance and GSAP for direct-child stagger, with `useReducedMotion` and the existing `useGsap` helper disabling movement for reduced-motion users.

- [x] **Step 3: Enforce typography and safe micro-motion globally**

Apply IBM Plex Sans Arabic to `html`, `body`, `#root`, form controls, and SVG text. Add color/shadow/icon transitions for shell buttons without overriding Framer Motion transforms, and disable them under reduced motion.

- [x] **Step 4: Run the unit contract**

Run `npm.cmd run test:unit -- src/lib/sitewideVisuals.test.js`.

Expected: PASS.

### Task 3: Apply the primitives to every page shell

**Files:**
- Modify: `src/App.jsx`

- [x] **Step 1: Replace duplicated flow-field layers**

Use `AmbientBackdrop` in Splash, Role selection, Assessment, institutional dashboard shells, and any shell already rendering `WaeyFlowField` directly.

- [x] **Step 2: Cover missing top-level backgrounds**

Add `AmbientBackdrop` to the student app shell, Marketing shell, institutional login, `FullPage`, and Leaderboard dialog.

- [x] **Step 3: Apply page motion**

Use `MotionPage` for student tabs, Marketing main content, institutional login content, institutional dashboard content, and full-page overlays. Retain the existing state-preserving `ScreenTransition` boundary.

- [x] **Step 4: Run focused browser verification**

Run `npm.cmd run test:e2e -- --grep "sitewide visual system" --reporter=line`.

Expected: PASS across public, student, and institutional routes.

### Task 4: Verify, commit, and preview

**Files:**
- Modify: `docs/superpowers/plans/2026-07-17-sitewide-motion-background-font.md`

- [x] **Step 1: Run complete verification**

Run `npm.cmd run check` and `npm.cmd run test:e2e -- --reporter=line`.

Expected: all unit tests, production build, and all browser tests pass.

- [ ] **Step 2: Commit the implementation**

Stage only the two motion components, `src/App.jsx`, `src/styles/waey-theme.css`, the tests, and this plan. Commit as `feat: extend motion and typography sitewide`.

- [ ] **Step 3: Start and verify localhost**

Run `npm.cmd run dev -- --host 127.0.0.1`, then request the printed URL and confirm it returns HTTP 200.
