import { expect, test } from "@playwright/test";

test("мобильная карточка каталога имеет корзину и длинную кнопку Подробнее", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Проверка предназначена для мобильного проекта");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/catalog");
  const card = page.locator(".product-card").first();
  await card.waitFor({ state: "visible", timeout: 8_000 }).catch(() => undefined);
  test.skip((await card.count()) === 0, "Каталог пуст — нечего проверять");

  const footer = card.locator(".product-card__footer");
  await expect(footer.locator(".product-cart-button")).toBeVisible();
  await expect(footer.locator(".product-details-button")).toBeVisible();
  await expect(card.getByText("0·0·12", { exact: true })).toHaveCount(0);

  const columns = await footer.evaluate((element) =>
    getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).filter(Boolean),
  );
  expect(columns).toHaveLength(2);
});

test("товар открывает подробную страницу и на ней нет блока продавца", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: testInfo.project.name.includes("mobile") ? 390 : 1280, height: 844 });
  await page.goto("/#/catalog");
  const details = page.locator(".product-details-button").first();
  await details.waitFor({ state: "visible", timeout: 8_000 }).catch(() => undefined);
  test.skip((await details.count()) === 0, "Каталог пуст — нечего открывать");
  await details.click();

  await expect(page.locator(".public-app--product")).toBeVisible();
  await expect(page.locator(".market-product-gallery-card")).toBeVisible();
  await expect(page.locator(".market-product-info-card")).toBeVisible();
  await expect(page.locator(".market-seller-card")).toHaveCount(0);
  await expect(page.getByText("Продавец", { exact: true })).toHaveCount(0);
  await expect(page.getByText("0·0·12", { exact: true })).toHaveCount(0);

  if (testInfo.project.name.includes("mobile")) {
    await expect(page.locator(".market-mobile-buybar")).toBeVisible();
    await expect(page.locator(".public-app--product .site-header--service-ui")).toBeHidden();
  }

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
