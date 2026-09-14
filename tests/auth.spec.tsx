import { test, expect } from "@playwright/test";
import {
  EMAIL,
  PASSWORD,
  USER_ID,
  chooseOption,
  login,
  setupSupabaseMocks,
  type ProfileRow,
} from "./supabaseMocks";

const donorProfile: ProfileRow = {
  id: USER_ID,
  user_type: "donor",
  name: "Ana E2E",
  phone: null,
  created_at: new Date().toISOString(),
};

test.describe("Autenticação no Elovoz", () => {
  test("faz login e leva o doador para as necessidades", async ({ page }) => {
    await setupSupabaseMocks(page, { profile: donorProfile });

    await page.goto("/");
    await page.getByRole("link", { name: "Já tenho conta" }).click();
    await expect(page).toHaveURL(/\/login/);

    await login(page);

    await expect(page).toHaveURL(/\/necessidades/);
    await expect(
      page.getByRole("heading", { name: "Necessidades" }),
    ).toBeVisible();
  });

  test("leva a ONG para o painel depois do login", async ({ page }) => {
    await setupSupabaseMocks(page, {
      profile: { ...donorProfile, user_type: "ong", name: "Casa Solidária" },
    });

    await page.goto("/login");
    await login(page);

    await expect(page).toHaveURL(/\/painel/);
  });

  test("mostra erro e permanece no login com credenciais inválidas", async ({
    page,
  }) => {
    await setupSupabaseMocks(page, { loginFails: true });

    await page.goto("/login");
    await login(page);

    await expect(page.getByText("E-mail ou senha inválidos")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("cadastra doador em um passo", async ({ page }) => {
    const state = await setupSupabaseMocks(page);

    await page.goto("/cadastrar");

    await page.getByRole("textbox", { name: "Nome completo" }).fill("Ana E2E");
    await page.getByRole("textbox", { name: "E-mail" }).fill(EMAIL);
    await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
    await page.getByLabel("Repita a senha").fill(PASSWORD);
    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page).toHaveURL(/\/necessidades/);
    expect(state.profile).toMatchObject({ user_type: "donor", name: "Ana E2E" });
  });

  test("cadastra ONG em três passos e mostra o cadastro em análise", async ({
    page,
  }) => {
    const state = await setupSupabaseMocks(page);

    await page.goto("/cadastrar");

    // passo 1 — conta
    await page.getByText("Sou uma ONG").click();
    await page
      .getByRole("textbox", { name: "Nome do responsável" })
      .fill("Ana E2E");
    await page.getByRole("textbox", { name: "E-mail" }).fill(EMAIL);
    await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
    await page.getByLabel("Repita a senha").fill(PASSWORD);
    await page.getByRole("button", { name: "Continuar" }).click();

    // passo 2 — dados institucionais
    await expect(page.getByText("Passo 2 de 3")).toBeVisible();
    await page
      .getByRole("textbox", { name: "Nome fantasia" })
      .fill("Casa Solidária");
    await page
      .getByRole("textbox", { name: "Razão social" })
      .fill("Associação Casa Solidária");
    await page.getByRole("textbox", { name: "CNPJ" }).fill("11222333000181");
    await page
      .getByRole("textbox", { name: "Missão da ONG" })
      .fill("Distribuir alimentos para famílias em situação de rua.");
    await page.getByRole("button", { name: "Continuar" }).click();

    // passo 3 — localização e contato
    await expect(page.getByText("Passo 3 de 3")).toBeVisible();
    await chooseOption(page, "Estado", "Rio de Janeiro");
    await chooseOption(page, "Cidade", "Rio de Janeiro");
    await page.getByRole("textbox", { name: "Bairro" }).fill("Centro");
    await page
      .getByRole("textbox", { name: "Endereço" })
      .fill("Rua das Flores, 100");
    await page
      .getByRole("textbox", { name: "Telefone 1" })
      .fill("21998765432");
    await page.getByRole("button", { name: "Enviar cadastro" }).click();

    await expect(
      page.getByRole("heading", { name: "Cadastro em análise" }),
    ).toBeVisible();

    expect(state.profile).toMatchObject({ user_type: "ong" });
    expect(state.ongs[0]).toMatchObject({
      trade_name: "Casa Solidária",
      cnpj: "11222333000181",
      verification_status: "pending",
      state_id: "uuid-rj",
      city_id: "uuid-rio",
    });
    expect(state.contacts[0]).toMatchObject({ number: "21998765432" });
  });

  test("pede o link de recuperação de senha", async ({ page }) => {
    await setupSupabaseMocks(page);

    await page.goto("/login");
    await page.getByRole("link", { name: "Esqueci minha senha" }).click();

    await page.getByRole("textbox", { name: "E-mail" }).fill(EMAIL);
    await page.getByRole("button", { name: "Enviar link" }).click();

    await expect(page.getByText(/enviamos um link/i)).toBeVisible();
  });
});
