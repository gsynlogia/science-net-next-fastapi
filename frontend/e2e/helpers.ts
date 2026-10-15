import { expect, type Page } from "@playwright/test";

export const PASSWORD = "Haslo12345!";

export function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1_000_000)}@example.com`;
}

export async function registerAccount(page: Page, fullName: string): Promise<string> {
  const email = uniqueEmail("e2e");
  await page.goto("/register");
  await page.getByLabel("Imię i nazwisko").fill(fullName);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Hasło", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Powtórz hasło").fill(PASSWORD);
  await page.getByRole("button", { name: "Załóż konto" }).click();
  await expect(page.getByRole("navigation").getByRole("link", { name: fullName })).toBeVisible();
  return email;
}
