import { expect, test } from "@playwright/test";

test("мобильная карточка товара использует market-layout", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Проверка предназначена для мобильного проекта");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/catalog");
  const productLink = page.locator(".product-card__media > a").first();
  await productLink.waitFor({ state: "visible", timeout: 8_000 }).catch(() => undefined);
  test.skip((await productLink.count()) === 0, "Каталог пуст — нечего открывать");
  await productLink.click();
  await expect(page.locator(".public-app--product")).toBeVisible();
  await expect(page.locator(".market-product-gallery-card")).toBeVisible();
  await expect(page.locator(".market-product-info-card")).toBeVisible();
  await expect(page.locator(".market-mobile-buybar")).toBeVisible();
  await expect(page.locator(".public-app--product .site-header--service-ui")).toBeHidden();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
