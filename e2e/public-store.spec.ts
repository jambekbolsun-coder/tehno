import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    for (const key of Object.keys(localStorage)) if (key.startsWith("tc2:")) localStorage.removeItem(key);
    sessionStorage.clear();
  });
});

test("публичный каталог загружается из Supabase без тестовых товаров", async ({ page }) => {
  await page.goto("/#/catalog");
  await expect(page.getByRole("heading", { name: "Каталог", exact: true })).toBeVisible();
  await expect(page.getByText(/тестовый товар/i)).toHaveCount(0);
});

test("язык и тема сохраняются после перезагрузки", async ({ page }) => {
  await page.goto("/#/");
  await page.getByRole("button", { name: "RU", exact: true }).first().click();
  await page.locator(".language-switcher__menu").getByText("EN", { exact: true }).click();
  await page.getByRole("button", { name: "Change theme" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("мобильное меню не создаёт горизонтальный скролл", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Проверка предназначена для мобильного проекта");
  for (const width of [320, 360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/#/");
    await page.getByRole("button", { name: "Открыть меню" }).click();
    await expect(page.locator(".mobile-drawer-layer")).toHaveClass(/is-open/);
    await page.waitForTimeout(350);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.keyboard.press("Escape");
    await expect(page.locator(".mobile-drawer-layer")).not.toHaveClass(/is-open/);
  }
});

test("публичные страницы помещаются в экран телефона", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Проверка предназначена для мобильного проекта");
  const routes = ["/", "/catalog", "/about", "/contacts", "/faq", "/favorites", "/cart", "/login"];
  for (const width of [320, 360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of routes) {
      await page.goto(`/#${route}`);
      await expect(page.locator("#root")).not.toBeEmpty();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${route} at ${width}px`).toBeLessThanOrEqual(1);
    }
  }
});
