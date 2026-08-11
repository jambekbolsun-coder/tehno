import { expect, test } from "@playwright/test";

test("скрытый переход /admin открывает защищённый вход", async ({ page }) => {
  await page.goto("/#/");
  await page.getByRole("textbox", { name: "Поиск" }).first().fill("/admin");
  await page.getByRole("textbox", { name: "Поиск" }).first().press("Enter");
  await expect(page).toHaveURL(/#\/login/);
  await expect(page.getByRole("heading", { name: "Вход в CRM" })).toBeVisible();
  await expect(page.getByText(/тестовый пароль/i)).toHaveCount(0);
});

test("управляющий входит с реальной учётной записью", async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, "Задайте E2E_ADMIN_EMAIL и E2E_ADMIN_PASSWORD после создания пользователя");
  await page.goto("/#/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Пароль").fill(password!);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/#\/crm\/admin\/dashboard/);
  await expect(page.getByRole("link", { name: "Финансы", exact: true })).toBeVisible();
});
