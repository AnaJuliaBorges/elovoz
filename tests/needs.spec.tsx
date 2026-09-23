import { test, expect } from "@playwright/test";
import {
  ONG_ID,
  USER_ID,
  chooseOption,
  login,
  needRow,
  setupSupabaseMocks,
  type OngRow,
  type ProfileRow,
} from "./supabaseMocks";

const ongProfile: ProfileRow = {
  id: USER_ID,
  user_type: "ong",
  name: "Ana E2E",
  phone: null,
  created_at: new Date().toISOString(),
};

const donorProfile: ProfileRow = { ...ongProfile, user_type: "donor" };

const approvedOng: OngRow = {
  id: ONG_ID,
  trade_name: "Casa Solidária",
  verification_status: "approved",
};

test.describe("Painel da ONG", () => {
  test("ONG aprovada publica uma necessidade", async ({ page }) => {
    const state = await setupSupabaseMocks(page, {
      profile: ongProfile,
      ong: approvedOng,
    });

    await page.goto("/login");
    await login(page);

    await expect(page).toHaveURL(/\/painel$/);
    await expect(
      page.getByRole("heading", { name: "Nenhuma necessidade publicada" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Nova necessidade" }).click();
    await page
      .getByRole("textbox", { name: "Título" })
      .fill("Agasalhos para o inverno");
    await chooseOption(page, "Categoria", "Alimentos");
    await page.getByRole("radio", { name: "Alta" }).click();
    await page
      .getByRole("textbox", { name: "Quantidade (opcional)" })
      .fill("30");
    await page.getByRole("button", { name: "Publicar necessidade" }).click();

    await expect(page).toHaveURL(/\/painel$/);
    // exact: sem ele, casa também com "Nenhuma necessidade publicada", que
    // ainda está na tela enquanto a lista recarrega
    await expect(
      page.getByText("Necessidade publicada", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Agasalhos para o inverno" }),
    ).toBeVisible();

    expect(state.insertedNeeds).toEqual([
      {
        ong_id: ONG_ID,
        title: "Agasalhos para o inverno",
        category_id: "cat-alimentos",
        description: null,
        quantity: 30,
        urgency: "high",
        deadline: null,
      },
    ]);
  });

  test("ONG marca uma necessidade como atendida", async ({ page }) => {
    const state = await setupSupabaseMocks(page, {
      profile: ongProfile,
      ong: approvedOng,
      needs: [needRow()],
    });

    await page.goto("/login");
    await login(page);

    await chooseOption(page, "Status", "Atendida");

    await expect(page.getByText("Status atualizado")).toBeVisible();
    expect(state.needs[0].status).toBe("fulfilled");
    await expect(page.getByRole("combobox", { name: "Status" })).toHaveText(
      "Atendida",
    );
  });

  test("ONG exclui uma necessidade depois de confirmar", async ({ page }) => {
    const state = await setupSupabaseMocks(page, {
      profile: ongProfile,
      ong: approvedOng,
      needs: [needRow()],
    });

    await page.goto("/login");
    await login(page);

    await page.getByRole("button", { name: "Excluir" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("Cestas básicas");
    await dialog.getByRole("button", { name: "Excluir" }).click();

    await expect(
      page.getByRole("heading", { name: "Nenhuma necessidade publicada" }),
    ).toBeVisible();
    expect(state.needs).toHaveLength(0);
  });

  test("ONG edita pelo detalhe e volta para o detalhe", async ({ page }) => {
    const state = await setupSupabaseMocks(page, {
      profile: ongProfile,
      ong: approvedOng,
      needs: [needRow()],
    });

    await page.goto("/login");
    await login(page);

    await page.getByRole("link", { name: "Cestas básicas" }).click();
    await expect(page).toHaveURL(/\/necessidades\/need-1$/);

    await page.getByRole("link", { name: /Editar necessidade/ }).click();
    await page
      .getByRole("textbox", { name: "Título" })
      .fill("Cestas básicas completas");
    await page.getByRole("button", { name: "Salvar alterações" }).click();

    // quem veio do detalhe volta para o detalhe, não para o painel da ONG
    await expect(page).toHaveURL(/\/necessidades\/need-1$/);
    await expect(
      page.getByRole("heading", { name: "Cestas básicas completas" }),
    ).toBeVisible();
    expect(state.needs[0].title).toBe("Cestas básicas completas");
  });

  test("ONG em análise vê o aviso e não publica", async ({ page }) => {
    await setupSupabaseMocks(page, {
      profile: ongProfile,
      ong: { ...approvedOng, verification_status: "pending" },
    });

    await page.goto("/login");
    await login(page);

    await expect(page.getByText("Cadastro em análise.")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Nova necessidade" }),
    ).toHaveCount(0);
  });
});

test.describe("Busca de necessidades", () => {
  test("doador filtra por urgência, abre o detalhe e volta com o filtro", async ({
    page,
  }) => {
    const state = await setupSupabaseMocks(page, {
      profile: donorProfile,
      needs: [
        needRow(),
        needRow({
          id: "need-2",
          title: "Agasalhos infantis",
          urgency: "low",
          category_id: "cat-roupas",
          category: { id: "cat-roupas", name: "Roupas e Calçados" },
        }),
      ],
    });

    await page.goto("/login");
    await login(page);

    await expect(page).toHaveURL(/\/necessidades$/);
    await expect(page.getByText("2 necessidades encontradas")).toBeVisible();

    await chooseOption(page, "Urgência", "Urgência alta");

    await expect(page).toHaveURL(/urgencia=high/);
    await expect(page.getByText("1 necessidade encontrada")).toBeVisible();
    await expect(page.getByText("Agasalhos infantis")).toHaveCount(0);
    expect(
      state.needRequests.some((url) => url.includes("urgency=eq.high")),
    ).toBe(true);

    await page.getByRole("link", { name: /Cestas básicas/ }).click();

    await expect(page).toHaveURL(/\/necessidades\/need-1$/);
    await expect(
      page.getByRole("heading", { name: "Cestas básicas" }),
    ).toBeVisible();
    await expect(page.getByText("Casa Solidária")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Ver perfil da ONG" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Voltar" }).click();

    await expect(page).toHaveURL(/urgencia=high/);
    await expect(page.getByRole("combobox", { name: "Urgência" })).toHaveText(
      "Urgência alta",
    );
  });
});
