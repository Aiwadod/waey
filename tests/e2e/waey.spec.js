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
  await page.getByRole("button", { name: /ابدأ|Start/ }).click();
  await page.getByRole("button", { name: /ابدأ الآن|Get started/ }).first().click();
  await page.getByRole("button", { name: /جامعة جدة|University of Jeddah/ }).click();

  await expect(page.getByText(/لوحة الجامعة|University dashboard/)).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("direct hash load opens the university dashboard", async ({ page }) => {
  await page.goto("/#/university");

  await expect(page.getByText(/لوحة الجامعة|University dashboard/)).toBeVisible();
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
  await page.getByRole("button", { name: /^دخول$|^Sign in$/ }).click();

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

test("language switch updates document direction", async ({ page }) => {
  await page.goto("/#/landing");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  await page.getByRole("button", { name: /تغيير اللغة|Change language/ }).click();

  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
});

test("role cards are keyboard-operable", async ({ page }) => {
  await page.goto("/#/roles");
  const university = page.getByRole("button", { name: /جامعة جدة|University of Jeddah/ });

  await university.focus();
  await page.keyboard.press("Enter");

  await expect(page.getByText(/لوحة الجامعة|University dashboard/)).toBeVisible();
});

test("mobile viewport renders the student app", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterAsGuest(page);

  await expect(page.getByText(/رصيد الحساب|Balance/)).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
});

test("landing opens in Waey light mode by default", async ({ page }) => {
  await page.goto("/#/landing");

  await expect(page.locator("[data-waey-theme='light']")).toBeVisible();
  await expect(page.locator("[data-waey-shell]")).toBeVisible();

  const bg = await page.locator("[data-waey-shell]").evaluate((node) => getComputedStyle(node).backgroundImage);
  expect(bg).not.toContain("rgb(0, 18, 28)");
  // Warm-palette lock: shell background carries the warm page tone #F1EFE9.
  expect(bg).toContain("241, 239, 233");
});

async function enterAsGuest(page) {
  await page.goto("/#/landing");
  await page.getByRole("button", { name: /تسجيل الدخول|Sign in/ }).first().click();
  await page.getByRole("button", { name: /الدخول كضيف|Continue as guest/ }).click();
  await expect(page).toHaveURL(/#\/student/);
}
