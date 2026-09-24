import { test } from "@playwright/test";

test("aquece o dev server", async ({ page }) => {
  test.setTimeout(120_000);

  await page.goto("/login");
  await page.getByRole("textbox", { name: "E-mail" }).waitFor();

  // a busca é pública: abre direto, sem redirecionar para o login
  await page.goto("/necessidades");
  await page.getByRole("heading", { name: "Necessidades" }).waitFor();
});
