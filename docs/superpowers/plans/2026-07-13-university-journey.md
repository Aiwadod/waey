# University Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the university portal with a focused three-page journey for institutional KPIs, college insights and campaigns, and downloadable reports without changing the bank portal.

**Architecture:** Keep React composition in `src/App.jsx` and isolate university-only static data and pure transformations in `src/lib/university.js`. Reuse `RoleShell`, `PrivacyNote`, and `downloadXls`; pass exactly three navigation entries from `UniDashInner` and leave all `BankDash*` code unchanged.

**Tech Stack:** React 18, Vite, Vitest, Playwright, existing inline theme tokens and Lucide icons.

---

### Task 1: University Data and Report Model

**Files:**
- Create: `src/lib/university.js`
- Create: `src/lib/university.test.js`

- [ ] **Step 1: Write failing unit tests**

```js
import { describe, expect, it } from "vitest";
import {
  addUniversityCampaign,
  buildUniversityPrintDocument,
  getUniversityPortal,
  universityReportRows,
} from "./university.js";

describe("university portal model", () => {
  it("localizes the portal and exposes the six university KPIs", () => {
    const portal = getUniversityPortal("en");
    expect(portal.nav).toEqual(["Dashboard", "Colleges Insights & Campaigns", "Reports"]);
    expect(portal.kpis).toHaveLength(6);
    expect(portal.colleges).toHaveLength(5);
  });

  it("rejects blank campaign names and appends valid campaigns immutably", () => {
    const original = getUniversityPortal("en").campaigns;
    expect(addUniversityCampaign(original, { name: "  ", college: "Business" }, "en").error).toBe("Enter a campaign name.");
    const result = addUniversityCampaign(original, { name: "Smart saving week", college: "Business" }, "en");
    expect(result.campaigns).toHaveLength(original.length + 1);
    expect(original).toHaveLength(2);
    expect(result.campaigns.at(-1).name).toBe("Smart saving week");
  });

  it("builds localized monthly and semester export formats", () => {
    expect(universityReportRows("en", "monthly")[0]).toEqual(["KPI", "Monthly value"]);
    expect(universityReportRows("en", "semester")[0]).toEqual(["KPI", "Semester value"]);
    const html = buildUniversityPrintDocument("ar", "semester");
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("تقرير وعي المالي");
  });
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `npm run test:unit -- src/lib/university.test.js`

Expected: FAIL because `src/lib/university.js` does not exist.

- [ ] **Step 3: Implement the pure university model**

Create bilingual portal copy and aggregated demo data. Implement:

```js
export function getUniversityPortal(lang = "ar") {
  return PORTALS[lang === "en" ? "en" : "ar"];
}

export function addUniversityCampaign(campaigns, input, lang = "ar") {
  const name = String(input.name || "").trim();
  if (!name) return { campaigns, error: lang === "en" ? "Enter a campaign name." : "أدخل اسم الحملة." };
  return {
    error: "",
    campaigns: [...campaigns, { id: `campaign-${campaigns.length + 1}`, name, college: input.college, participants: 0, completion: 0, engagementImpact: 0, awarenessImpact: 0 }],
  };
}

export function universityReportRows(lang = "ar", period = "monthly") {
  const portal = getUniversityPortal(lang);
  const periodLabel = period === "semester" ? portal.semesterValue : portal.monthlyValue;
  return [[portal.kpiLabel, periodLabel], ...portal.kpis.map((item) => [item.label, item.value])];
}

export function buildUniversityPrintDocument(lang = "ar", period = "monthly") {
  const portal = getUniversityPortal(lang);
  const rows = universityReportRows(lang, period).map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("");
  return `<!doctype html><html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><title>${portal.reportTitle}</title></head><body><h1>${portal.reportTitle}</h1><table>${rows}</table><p>${portal.privacy}</p></body></html>`;
}
```

The portal must contain 4,250 students, 5 colleges, 72% engagement, 18% awareness improvement, 78% challenge completion, and 6 completed campaigns.

- [ ] **Step 4: Run the test and confirm GREEN**

Run: `npm run test:unit -- src/lib/university.test.js`

Expected: all university model tests pass.

### Task 2: Three-Page University Portal

**Files:**
- Modify: `src/App.jsx`
- Modify: `tests/e2e/waey.spec.js`

- [ ] **Step 1: Write the failing browser journey test**

Update the direct university route assertion and add a flow that signs in, verifies `Dashboard`, opens `Colleges Insights & Campaigns`, creates `Smart saving week`, and opens `Reports` to verify Excel and PDF actions.

```js
test("university portal exposes the three-page campaign and reports journey", async ({ page }) => {
  await page.goto("/#/university");
  await signInToPortal(page);
  await expect(page.getByRole("heading", { name: /نظرة عامة على الجامعة|University overview/ })).toBeVisible();
  await page.getByRole("button", { name: /رؤى الكليات والحملات|Colleges Insights & Campaigns/ }).click();
  await page.getByRole("button", { name: /إنشاء حملة|Create campaign/ }).click();
  await page.getByLabel(/اسم الحملة|Campaign name/).fill("Smart saving week");
  await page.getByRole("button", { name: /حفظ الحملة|Save campaign/ }).click();
  await expect(page.getByText("Smart saving week")).toBeVisible();
  await page.getByRole("button", { name: /التقارير|Reports/ }).click();
  await expect(page.getByRole("button", { name: /Excel/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /PDF/ })).toBeVisible();
});
```

- [ ] **Step 2: Run the browser test and confirm RED**

Run: `npx playwright test tests/e2e/waey.spec.js --grep "three-page campaign"`

Expected: FAIL because the new navigation and headings do not exist.

- [ ] **Step 3: Implement university-only React pages**

Import the pure model functions. Replace only `UniDashInner` and add university-specific presentation helpers immediately above it:

```jsx
function UniversityDashboardPage({ c, portal }) {
  return <section aria-labelledby="university-overview"><h2 id="university-overview">{portal.dashboardTitle}</h2><div>{portal.kpis.map((item) => <article key={item.id} style={{ background: c.card }}><strong>{item.value}</strong><span>{item.label}</span></article>)}</div><PrivacyNote c={c}>{portal.privacy}</PrivacyNote></section>;
}

function UniversityInsightsPage({ c, portal, campaigns, onAddCampaign }) {
  return <section aria-labelledby="university-insights"><h2 id="university-insights">{portal.insightsTitle}</h2><div>{portal.insights.map((item) => <article key={item.id} style={{ background: c.card }}><span>{item.label}</span><strong>{item.value}</strong></article>)}</div><button onClick={onAddCampaign}>{portal.createCampaign}</button><div>{campaigns.map((campaign) => <article key={campaign.id}>{campaign.name}</article>)}</div><PrivacyNote c={c}>{portal.privacy}</PrivacyNote></section>;
}

function UniversityReportsPage({ c, portal, lang, period, setPeriod, onExcel, onPdf }) {
  return <section aria-labelledby="university-reports"><h2 id="university-reports">{portal.reportsTitle}</h2><Segmented options={portal.reportPeriods} value={period === "monthly" ? 0 : 1} onChange={(index) => setPeriod(index === 0 ? "monthly" : "semester")} c={c} label={portal.reportsTitle} /><button onClick={onExcel}>Excel</button><button onClick={onPdf}>PDF</button><PrivacyNote c={c}>{portal.privacy}</PrivacyNote></section>;
}
```

Use the existing theme tokens and `PrivacyNote`. Configure `RoleShell` with only:

```jsx
[
  { tab: 0, label: portal.nav[0], icon: Home },
  { tab: 1, label: portal.nav[1], icon: Building2 },
  { tab: 2, label: portal.nav[2], icon: ClipboardList },
]
```

For Excel call `downloadXls(portal.reportSheet, universityReportRows(lang, period), filename)`. For PDF open a blank popup, write `buildUniversityPrintDocument(lang, period)`, and call `print()`.

- [ ] **Step 4: Run targeted tests and confirm GREEN**

Run: `npm run test:unit -- src/lib/university.test.js`

Run: `npx playwright test tests/e2e/waey.spec.js --grep "three-page campaign"`

Expected: both commands pass.

### Task 3: Full Verification and Scope Audit

**Files:**
- Verify: `src/App.jsx`
- Verify: `src/lib/university.js`
- Verify: `tests/e2e/waey.spec.js`

- [ ] **Step 1: Run project verification**

Run: `npm run check`

Expected: all unit tests pass and the Vite production build exits successfully.

- [ ] **Step 2: Run full browser verification**

Run: `npm run test:e2e`

Expected: the full Chromium suite passes.

- [ ] **Step 3: Audit the diff for bank isolation**

Run: `git diff -- src/App.jsx src/lib/university.js src/lib/university.test.js tests/e2e/waey.spec.js`

Confirm that changes in `src/App.jsx` are limited to the university import, university-only helpers, and `UniDashInner`; `BankDashScreen`, `BankDashInner`, and all `scope === "bank"` branches remain unchanged.
