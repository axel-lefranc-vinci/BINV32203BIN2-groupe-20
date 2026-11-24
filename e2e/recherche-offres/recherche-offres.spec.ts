import { expect, test, type Page } from "@playwright/test";

async function openOffersAsLucas(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: "Lucas Dupont", exact: true }).click();
  await page.getByRole("link", { name: "Offres", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Offres de stage" })).toBeVisible();
}

test("scénario 1 - recherche nominale insensible à la casse avec résultat P2", async ({
  page,
}) => {
  await openOffersAsLucas(page);

  await expect(page.getByText("4 offres", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Période" }),
  ).toHaveValue("");

  await page
    .getByRole("searchbox", { name: "Recherche" })
    .fill("  aPpLiCAtIoN  ");
  await page.getByRole("combobox", { name: "Période" }).selectOption("P2");

  await expect(page.getByText("1 offre", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("row", {
      name: /Application React de gestion de flotte/,
    }),
  ).toContainText("Lumen Digital");
  await expect(
    page.getByRole("row", {
      name: /Application React de gestion de flotte/,
    }),
  ).toContainText("2026-2027");
  await expect(
    page.getByRole("row", {
      name: /Application React de gestion de flotte/,
    }),
  ).toContainText("P2");
  await expect(
    page.getByRole("row", {
      name: /Application React de gestion de flotte/,
    }),
  ).toContainText("Publiée");

  const table = page.getByRole("table");
  await expect(table.getByRole("row")).toHaveCount(2);
  await expect(table).not.toContainText("API REST de facturation");
  await expect(table).not.toContainText("Tableau de bord de qualité des données");
  await expect(table).not.toContainText("Assistant conversationnel interne");
});

test("scénario 2 - recherche particulière sans résultat", async ({ page }) => {
  await openOffersAsLucas(page);

  await expect(page.getByText("4 offres", { exact: true })).toBeVisible();
  await page
    .getByRole("searchbox", { name: "Recherche" })
    .fill("expression-inexistante");

  await expect(
    page.getByText("Aucune offre ne correspond à votre recherche.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(page.getByText("Aucune offre à afficher.", { exact: true })).toHaveCount(0);
});
