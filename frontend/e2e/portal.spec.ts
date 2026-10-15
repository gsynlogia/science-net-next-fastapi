import { expect, test } from "@playwright/test";
import { PASSWORD, registerAccount } from "./helpers";

const SEEDED_ARTICLE = "Szybkie algorytmy dla grafów rzadkich";

test("gość przegląda tablicę, wyszukuje i otwiera artykuł", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Tablica" })).toBeVisible();
  await page.getByRole("searchbox", { name: "Szukaj artykułów" }).fill("grafy");
  const card = page.getByRole("article").filter({ hasText: SEEDED_ARTICLE });
  await expect(card).toHaveCount(1);
  await card.getByRole("link", { name: SEEDED_ARTICLE }).click();
  await expect(page).toHaveURL(/\/articles\/\d+$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(SEEDED_ARTICLE);
  await expect(page).toHaveTitle(`${SEEDED_ARTICLE} · Science Net`);
});

test("nieistniejący artykuł zwraca kod 404 i stronę błędu", async ({ page }) => {
  const response = await page.goto("/articles/999999");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Nie znaleziono strony" })).toBeVisible();
});

test("rejestracja, publikacja artykułu, reakcja, komentarz i wylogowanie", async ({ page }) => {
  await registerAccount(page, "Ewa E2E");
  const title = `Badanie E2E ${Date.now()}`;
  await page.getByRole("link", { name: "Nowy artykuł" }).click();
  await page.getByLabel("Tytuł").fill(title);
  await page
    .getByLabel("Streszczenie")
    .fill("Streszczenie badania przeprowadzonego w teście przeglądarkowym.");
  await page.getByLabel("Dziedzina").selectOption("physics");
  await page.getByLabel("Tagi (oddzielone przecinkami)").fill("e2e, test");
  await page.getByRole("button", { name: "Opublikuj" }).click();
  await expect(page).toHaveURL(/\/articles\/\d+$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);

  await page.getByRole("button", { name: "Przydatne (0)" }).click();
  await expect(page.getByRole("button", { name: "Przydatne (1)" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.getByLabel("Twój komentarz").fill("Pierwszy komentarz z testu E2E.");
  await page.getByRole("button", { name: "Dodaj komentarz" }).click();
  await expect(page.getByText("Pierwszy komentarz z testu E2E.")).toBeVisible();
  await expect(page.getByText("Komentarze: 1")).toBeVisible();

  await page.getByRole("button", { name: "Wyloguj" }).click();
  await expect(
    page.getByRole("navigation").getByRole("link", { name: "Zaloguj się" }),
  ).toBeVisible();
});

test("logowanie kontem demonstracyjnym i obserwowanie autora", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("maria@example.com");
  await page.getByLabel("Hasło").fill(PASSWORD);
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await expect(
    page.getByRole("navigation").getByRole("link", { name: "Maria Wiśniewska" }),
  ).toBeVisible();

  await page.getByRole("searchbox", { name: "Szukaj artykułów" }).fill("koralowce");
  await expect(page.getByRole("article")).toHaveCount(1);
  await page.getByRole("article").getByRole("link", { name: "Jan Nowak" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Jan Nowak");

  const followers = page.getByText(/^Obserwujący: \d+$/);
  const before = Number((await followers.textContent())?.replace("Obserwujący: ", ""));
  const follow = page.getByRole("button", { name: /Obserwuj|Przestań obserwować/ });
  const wasFollowing = (await follow.textContent()) === "Przestań obserwować";
  await follow.click();
  const expected = wasFollowing ? before - 1 : before + 1;
  await expect(followers).toHaveText(`Obserwujący: ${expected}`);
  await follow.click();
  await expect(followers).toHaveText(`Obserwujący: ${before}`);
});

test("asystent AI wyświetla strumień na bieżąco (odpowiedź serwera podmieniona)", async ({
  page,
}) => {
  await registerAccount(page, "Adam AI");
  await page.route("**/api/articles/*/summary", (route) =>
    route.fulfill({
      status: 200,
      headers: { "content-type": "text/event-stream" },
      body: 'data: "Ala "\n\ndata: "ma kota."\n\n',
    }),
  );
  await page.goto("/");
  await page.getByRole("searchbox", { name: "Szukaj artykułów" }).fill("grafy");
  await page.getByRole("link", { name: SEEDED_ARTICLE }).click();
  await page.getByRole("button", { name: "Streść (AI)" }).click();
  await expect(page.getByText("Ala ma kota.")).toBeVisible();
  await expect(page.getByText(/lokalny model AI/)).toBeVisible();
});

test("asystent AI pokazuje komunikat, gdy model zgłosi błąd", async ({ page }) => {
  await registerAccount(page, "Adam AI");
  await page.route("**/api/articles/*/summary", (route) =>
    route.fulfill({
      status: 200,
      headers: { "content-type": "text/event-stream" },
      body: 'event: error\ndata: "Model nie odpowiada."\n\n',
    }),
  );
  await page.goto("/");
  await page.getByRole("searchbox", { name: "Szukaj artykułów" }).fill("grafy");
  await page.getByRole("link", { name: SEEDED_ARTICLE }).click();
  await page.getByRole("button", { name: "Streść (AI)" }).click();
  await expect(page.getByRole("region", { name: "Asystent AI" }).getByRole("alert")).toHaveText(
    "Model nie odpowiada.",
  );
});
