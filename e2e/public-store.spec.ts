import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const marker = "__tc2_e2e_reset_done";
    if (sessionStorage.getItem(marker)) return;
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("tc2:")) localStorage.removeItem(key);
    }
    sessionStorage.setItem(marker, "1");
  });
});

const waitForProducts = async (page: Page) => {
  const cards = page.locator(".product-card");
  await cards.first().waitFor({ state: "visible", timeout: 8_000 }).catch(() => undefined);
  return cards;
};

test("главная открывает мобильную витрину с адаптивной каруселью и живыми товарами", async ({ page }) => {
  await page.goto("/#/");
  await expect(page.locator(".market-banner-carousel")).toBeVisible();
  await expect(page.locator(".market-banner")).toHaveCount(4);
  await expect(page.locator(".market-banner picture")).toHaveCount(4);
  await expect(page.locator(".market-banner source[media='(max-width: 640px)']")).toHaveCount(4);
  await expect(page.locator(".market-banner source[media='(max-width: 1100px)']")).toHaveCount(4);
  await expect(page.getByText(/тестовый товар/i)).toHaveCount(0);
});

test("витрина не показывает покупателю складские остатки", async ({ page }) => {
  await page.goto("/#/");
  await expect(page.locator(".market-banner-carousel")).toBeVisible();
  await expect(page.locator(".stock-dot")).toHaveCount(0);
  await expect(page.getByText(/осталось\s+\d+|в наличии\s*[·:]\s*\d+|нет в наличии/i)).toHaveCount(0);
});

test("каталог показывает только компактный поиск, а фильтры открывает по кнопке", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Проверка предназначена для мобильного проекта");
  await page.goto("/#/catalog");
  await expect(page.locator(".market-catalog-searchbar")).toBeVisible();
  await expect(page.locator(".catalog-sidebar")).toBeHidden();
  await page.locator(".market-filter-trigger").click();
  await expect(page.locator(".market-filter-sheet").last()).toBeVisible();
});

test("корзина не ограничивает количество текущим складским остатком", async ({ page }) => {
  await page.goto("/#/");
  const cards = await waitForProducts(page);
  test.skip((await cards.count()) === 0, "Каталог пуст — нечего добавлять в корзину");
  await cards.first().locator(".product-cart-button").click();
  await page.goto("/#/cart");
  await expect(page.locator(".cart-item").first()).toBeVisible();
  const quantity = page.locator(".cart-item__quantity").first();
  const increase = quantity.getByRole("button", { name: "Увеличить", exact: true });
  for (let index = 0; index < 20; index += 1) await increase.click();
  await expect(quantity.locator("span")).toHaveText("21");
  await expect(page.getByText(/доступно только|нет в наличии|остаток/i)).toHaveCount(0);
});

test("язык и тема сохраняются после перезагрузки", async ({ page }, testInfo) => {
  await page.goto("/#/");
  const mobile = testInfo.project.name.includes("mobile");

  if (mobile) {
    await page.getByRole("button", { name: "Открыть меню" }).click();
    const drawer = page.locator(".mobile-drawer");
    await drawer.locator(".language-tabs").getByText("EN", { exact: true }).click();
    await drawer.locator(".mobile-theme").click();
  } else {
    await page.getByRole("button", { name: "RU", exact: true }).first().click();
    await page.locator(".language-switcher__menu").getByText("EN", { exact: true }).click();
    await page.locator(".header-actions > button.icon-button").first().click();
  }

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
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

test("на телефоне сетка каталога всегда состоит из двух колонок", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Проверка предназначена для мобильного проекта");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/catalog");
  const grid = page.locator(".product-grid").first();
  await expect(grid).toBeVisible();
  const tracks = await grid.evaluate((element) =>
    getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).filter(Boolean),
  );
  expect(tracks).toHaveLength(2);
});

test("публичные страницы помещаются в экран телефона и не падают в console", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Проверка предназначена для мобильного проекта");
  const routes = ["/", "/catalog", "/about", "/contacts", "/faq", "/favorites", "/cart", "/login"];
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });
  for (const width of [320, 360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of routes) {
      await page.goto(`/#${route}`);
      await expect(page.locator("#root")).not.toBeEmpty();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${route} at ${width}px`).toBeLessThanOrEqual(1);
    }
  }
  expect(runtimeErrors).toEqual([]);
});

test("невалидный QR менеджера безопасно отклоняется", async ({ page }) => {
  await page.goto("/#/manager/join?token=invalid-token");
  await expect(page.getByRole("heading", { name: "QR недействителен" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Перейти ко входу" })).toBeVisible();
});
