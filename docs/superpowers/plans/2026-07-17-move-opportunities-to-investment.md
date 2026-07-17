# Move Opportunities to Investment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the student opportunity block from Home into Investment without changing its interactions.

**Architecture:** Keep the existing cards and overlay state in `src/App.jsx`. Extract the contiguous JSX into `OpportunitiesSection`, render it from `Invest`, and remove it from `HomeScreen` so there is one owner and no duplicated state.

**Tech Stack:** React 18, Vite, Vitest, Playwright

---

### Task 1: Relocate the opportunity block

**Files:**
- Modify: `src/App.jsx:3105-3185`
- Modify: `src/App.jsx:4125-4180`
- Test: `tests/e2e/waey.spec.js`

- [x] **Step 1: Write the failing browser test**

Add a test that enters as a guest, confirms “Opportunities for you” is absent from Home, selects Investment, and confirms the heading plus Smart Jar, Jamiyah, temporary jobs, cashback, and Friends are visible.

```js
test("opportunities live in investment instead of home", async ({ page }) => {
  await enterAsGuest(page);
  await expect(page.getByText(/فرص لك|Opportunities for you/)).toHaveCount(0);

  await page.getByRole("button", { name: /الاستثمار|Investment/ }).click();

  await expect(page.getByText(/فرص لك|Opportunities for you/)).toBeVisible();
  await expect(page.getByText(/كنز الفك|Spare-change vault/)).toBeVisible();
  await expect(page.getByText(/الجمعية · ادخار جماعي|Savings circle/)).toBeVisible();
  await expect(page.getByText(/وظائف مؤقتة · دخل إضافي|Side gigs · extra income/)).toBeVisible();
  await expect(page.getByText(/كاش باك وعروض|Cashback & offers/)).toBeVisible();
  await expect(page.getByText(/الأصدقاء|Friends/)).toBeVisible();
});
```

- [x] **Step 2: Run the focused test to verify it fails**

Run: `npm.cmd run test:e2e -- --grep "opportunities live in investment"`

Expected: FAIL because the opportunity heading and cards still render on Home.

- [x] **Step 3: Extract and relocate the JSX**

Create `OpportunitiesSection` using the existing `RoundUpCard`, three `EntryCard` instances, and Friends card. Remove that JSX from `HomeScreen` and render `<OpportunitiesSection />` in `Invest` immediately below `<ScreenHead>`.

```jsx
function OpportunitiesSection() {
  const { c, s, setOverlay } = useCtx();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SectionTitle icon={Sparkles}>{s.homeSections.opportunities}</SectionTitle>
      <RoundUpCard />
      <EntryCard icon={Handshake} title={s.jamTitle} sub={s.jamSub} onClick={() => setOverlay("jamiyah")} />
      <EntryCard icon={Briefcase} title={s.jobsTitle} sub={s.jobsSub} onClick={() => setOverlay("jobs")} />
      <EntryCard icon={Gift} title={s.cashTitle} sub={s.cashSub} onClick={() => setOverlay("cashback")} />
      <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 22, padding: 16 }}>
        <div style={{ display: "flex" }}>
          {[c.accent, c.terra, c.green].map((col, i) => <span key={i} style={{ width: 28, height: 28, borderRadius: 999, background: col, marginInlineStart: i ? -9 : 0, border: `2px solid ${c.card}`, display: "grid", placeItems: "center" }}><Users size={12} color={c.onAccent} /></span>)}
        </div>
        <div style={{ fontWeight: 700, marginTop: 10 }}>{s.friends}</div>
        <div style={{ color: c.accentText, fontSize: 12, fontWeight: 600 }}><Metric value={14} /> {s.online}</div>
      </div>
    </div>
  );
}
```

- [x] **Step 4: Run focused and broad verification**

Run: `npm.cmd run test:e2e -- --grep "opportunities live in investment"`

Expected: PASS.

Run: `npm.cmd run check`

Expected: all unit tests pass and Vite production build succeeds.

- [ ] **Step 5: Commit the implementation**

```bash
git add src/App.jsx tests/e2e/waey.spec.js docs/superpowers/plans/2026-07-17-move-opportunities-to-investment.md
git commit -m "feat: move opportunities into investment"
```

### Task 2: Start the review server

**Files:**
- No file changes.

- [ ] **Step 1: Start Vite on an available localhost port**

Run: `npm.cmd run dev -- --host 127.0.0.1`

Expected: Vite prints a local URL that opens the restored app.

- [ ] **Step 2: Confirm the server responds**

Open the printed URL and verify the app loads successfully.
