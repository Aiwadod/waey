import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("__waey_e2e_initialized")) {
      localStorage.clear();
      sessionStorage.setItem("__waey_e2e_initialized", "1");
    }
  });
});

test("splash to University of Jeddah dashboard does not crash", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");
  // The splash is a single "ابدأ" button that auto-advances to the landing
  // after ~2.4s; click it when we win the race, continue either way.
  await page.getByRole("button", { name: /^(ابدأ|Start)$/ }).click({ timeout: 2000 }).catch(() => {});
  await page.getByRole("button", { name: /ابدأ الآن|Get started/ }).first().click();
  await page.getByRole("button", { name: /جامعة جدة|University of Jeddah/ }).click();

  await signInToPortal(page);
  await expect(page.getByText(/تنبيهات ذكية اليوم|Smart alerts today/)).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("direct hash load opens the university dashboard", async ({ page }) => {
  await page.goto("/#/university");

  await signInToPortal(page);
  await expect(page.getByText(/تنبيهات ذكية اليوم|Smart alerts today/)).toBeVisible();
});

test("empty login is rejected", async ({ page }) => {
  await page.goto("/#/landing");
  await page.getByRole("button", { name: /تسجيل الدخول|Sign in/ }).first().click();
  await page.getByRole("button", { name: /^دخول$|^Sign in$/ }).click();

  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).not.toHaveURL(/#\/student/);
});

test("valid login and guest entry persist the student app on reload", async ({ page }) => {
  await page.goto("/#/landing");
  await page.getByRole("button", { name: /تسجيل الدخول|Sign in/ }).first().click();
  await page.getByLabel(/البريد|Email/).fill("student@example.com");
  await page.getByLabel(/كلمة المرور|Password/).fill("secret");
  // Submit with Enter — the login is a real <form>.
  await page.getByLabel(/كلمة المرور|Password/).press("Enter");

  await expect(page).toHaveURL(/#\/student/);
  await expect(page.getByText(/رصيد الحساب|Balance/)).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/#\/student/);
  await expect(page.getByText(/رصيد الحساب|Balance/)).toBeVisible();

  await page.getByRole("button", { name: /المزيد|More/ }).click();
  await page.getByText(/تسجيل الخروج|Log out/).click();
  await expect(page).toHaveURL(/#\/landing/);

  await page.getByRole("button", { name: /تسجيل الدخول|Sign in/ }).first().click();
  await page.getByRole("button", { name: /الدخول كضيف|Continue as guest/ }).click();
  await page.reload();
  await expect(page).toHaveURL(/#\/student/);
  await expect(page.getByText(/رصيد الحساب|Balance/)).toBeVisible();
});

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

test("sitewide visual system covers public, student, and institutional pages", async ({ page }) => {
  await page.goto("/#/landing");
  await expect(page.locator("[data-waey-backdrop]")).toBeVisible();

  await enterAsGuest(page);
  await expect(page.locator("[data-waey-backdrop]")).toBeVisible();
  await expect(page.locator("[data-waey-motion-page]")).toBeVisible();

  await page.goto("/#/university");
  await expect(page.locator("[data-waey-backdrop]")).toBeVisible();
});

test("loan success and insufficient-loan block are visible in the browser flow", async ({ page }) => {
  await enterAsGuest(page);
  await page.getByRole("button", { name: /التحليلات|Analytics/ }).click();

  await page.getByPlaceholder(/المبلغ|Amount/).fill("650");
  await page.getByPlaceholder(/السبب|Reason/).fill("coffee e2e");
  await page.getByRole("button", { name: /تسجيل|Log/ }).click();
  await expect(page.getByText(/مصروفك يتجاوز|exceeds your available/)).toBeVisible();
  await page.getByRole("button", { name: /اعتمد القرض|Approve loan/ }).click();
  await expect(page.getByText(/coffee e2e/)).toBeVisible();

  await page.getByPlaceholder(/المبلغ|Amount/).fill("400");
  await page.getByPlaceholder(/السبب|Reason/).fill("rent e2e");
  await page.getByRole("button", { name: /تسجيل|Log/ }).click();
  await expect(page.getByText(/الرصيد لا يكفي|balance/i)).toBeVisible();
});

test("transfer arms a confirmation step before moving money", async ({ page }) => {
  await enterAsGuest(page);
  await page.getByRole("button", { name: /^تحويل$|^Transfer$/ }).first().click();
  await page.getByLabel(/المبلغ|Amount/).fill("100");
  await page.getByRole("button", { name: /تحويل الآن|Send now/ }).click();

  // First tap only arms the button — money moves on the explicit confirm.
  const confirm = page.getByRole("button", { name: /تأكيد إرسال|Confirm sending/ });
  await expect(confirm).toBeVisible();
  await confirm.click();
  await expect(page.getByText(/حوّلت|Sent 100/)).toBeVisible();
});

test("language switch updates document direction and persists across reload", async ({ page }) => {
  await page.goto("/#/landing");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  await page.getByRole("button", { name: /تغيير اللغة|Change language/ }).click();

  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
});

test("role cards are keyboard-operable", async ({ page }) => {
  await page.goto("/#/roles");
  const university = page.getByRole("button", { name: /جامعة جدة|University of Jeddah/ });

  await university.focus();
  await page.keyboard.press("Enter");

  // The institutional dashboards sit behind a demo login portal.
  await expect(page.getByRole("heading", { name: /بوابة الجامعة|University portal/ })).toBeVisible();
});

test("mobile viewport renders the student app", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterAsGuest(page);

  await expect(page.getByText(/رصيد الحساب|Balance/)).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
});

test("mobile landing moves secondary navigation into a collapsible sidebar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/landing");

  const menuButton = page.getByRole("button", { name: /فتح القائمة|Open menu/ });
  await expect(menuButton).toBeVisible();
  await expect(page.getByText(/Waey · .*2030/)).toHaveCount(0);

  await menuButton.click();
  const sidebar = page.getByRole("dialog", { name: /القائمة الرئيسية|Main menu/ });
  await expect(sidebar).toBeVisible();
  await expect(sidebar.getByRole("button", { name: /^عن وعي$|^About$/ })).toBeVisible();
  await expect(sidebar.getByRole("button", { name: /تغيير اللغة|Change language/ })).toBeVisible();
  await expect(sidebar.getByRole("button", { name: /تغيير المظهر|Change theme/ })).toBeVisible();
  await expect(sidebar.getByRole("button", { name: /تسجيل الدخول|Sign in/ })).toBeVisible();
  await expect(page.locator("header").getByRole("button", { name: /تسجيل الدخول|Sign in/ })).toHaveCount(0);
});

test("landing opens in Waey light mode by default", async ({ page }) => {
  await page.goto("/#/landing");

  // Deep links play the splash intro first; wait for the landing hero heading
  // (the splash h1 is the brand name) so the palette check reads the marketing
  // shell, not the splash (pre-existing race).
  await expect(page.getByRole("heading", { name: /وعيك المالي|Money awareness/ })).toBeVisible({ timeout: 15000 });

  await expect(page.locator("[data-waey-theme='light']")).toBeVisible();
  await expect(page.locator("[data-waey-shell]")).toBeVisible();

  const bg = await page.locator("[data-waey-shell]").evaluate((node) => getComputedStyle(node).backgroundImage);
  expect(bg).not.toContain("rgb(0, 18, 28)");
  // Warm-palette lock: shell background carries the warm page tone #F1EFE9.
  expect(bg).toContain("241, 239, 233");
});

test("reduced motion keeps Waey usable without transform-heavy motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/landing");

  await expect(page.locator("[data-waey-shell]")).toBeVisible();
  const motionScale = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--waey-motion-scale").trim());
  expect(motionScale).toBe("0");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
});

async function enterAsGuest(page) {
  await page.goto("/#/landing");
  await page.getByRole("button", { name: /تسجيل الدخول|Sign in/ }).first().click();
  await page.getByRole("button", { name: /الدخول كضيف|Continue as guest/ }).click();
  await expect(page).toHaveURL(/#\/student/);
}

// The uni/bank dashboards sit behind a demo login (any credentials pass) and a
// one-time onboarding walkthrough — sign in, then skip the walkthrough.
async function signInToPortal(page) {
  await expect(page.getByRole("heading", { name: /بوابة الجامعة|بوابة البنك|University portal|Bank portal/ })).toBeVisible();
  await page.getByRole("button", { name: /^تسجيل الدخول$|^Sign in$/ }).click();
  await page.getByRole("button", { name: /تخطّي|Skip/ }).click().catch(() => {});
}
