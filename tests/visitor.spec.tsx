import { test, expect } from "@playwright/test";
import { EMAIL, PASSWORD, needRow, setupSupabaseMocks } from "./supabaseMocks";

test.describe("Visitante sem conta", () => {
  test("navega pelas necessidades e só cria conta para manifestar interesse", async ({
    page,
  }) => {
    const state = await setupSupabaseMocks(page, { needs: [needRow()] });

    await page.goto("/");
    await page.getByRole("link", { name: "Ver necessidades" }).click();

    await expect(page).toHaveURL(/\/necessidades$/);
    await page.getByRole("link", { name: /Cestas básicas/ }).click();
    await expect(page).toHaveURL(/\/necessidades\/need-1$/);

    await page.getByRole("button", { name: "Tenho interesse" }).click();
    const dialog = page.getByRole("alertdialog", {
      name: "Crie sua conta para doar",
    });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("link", { name: "Criar conta" }).click();

    await expect(page).toHaveURL(/\/cadastrar\?voltar=%2Fnecessidades%2Fneed-1/);

    await page.getByRole("textbox", { name: "Nome completo" }).fill("Ana E2E");
    await page.getByRole("textbox", { name: "E-mail" }).fill(EMAIL);
    await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
    await page.getByLabel("Repita a senha").fill(PASSWORD);
    await page.getByRole("button", { name: "Criar conta" }).click();

    // volta para a mesma necessidade, agora como doadora
    await expect(page).toHaveURL(/\/necessidades\/need-1$/);
    expect(state.profile).toMatchObject({ user_type: "donor" });

    await page.getByRole("button", { name: "Tenho interesse" }).click();
    await expect(page.getByLabel("Mensagem para a instituição")).toBeVisible();
  });
});
