import { test, expect } from "@playwright/test";
import {
  ONG_ID,
  USER_ID,
  login,
  needRow,
  ongProfileRow,
  setupSupabaseMocks,
  type OngRow,
  type ProfileRow,
} from "./supabaseMocks";

const donorProfile: ProfileRow = {
  id: USER_ID,
  user_type: "donor",
  name: "Ana E2E",
  phone: null,
  created_at: new Date().toISOString(),
};

test.describe("Perfil público da ONG", () => {
  test("doador chega pelo detalhe, vê a ONG e passa a seguir", async ({
    page,
  }) => {
    const state = await setupSupabaseMocks(page, {
      profile: donorProfile,
      ongProfile: ongProfileRow(),
      needs: [
        needRow(),
        needRow({
          id: "need-2",
          title: "Cobertores",
          status: "fulfilled",
        }),
      ],
    });

    await page.goto("/login");
    await login(page);

    await page.getByRole("link", { name: /Cestas básicas/ }).click();
    await page.getByRole("link", { name: "Ver perfil da ONG" }).click();

    await expect(page).toHaveURL(new RegExp(`/ongs/${ONG_ID}$`));
    await expect(
      page.getByRole("heading", { name: "Casa Solidária" }),
    ).toBeVisible();
    await expect(page.getByText("Associação Casa Solidária")).toBeVisible();
    await expect(
      page.getByText("Acolher famílias em situação de rua no centro da cidade"),
    ).toBeVisible();
    await expect(page.getByText("CNPJ 12.345.678/0001-95")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /\(21\) 99999-1234/ }),
    ).toHaveAttribute("href", "https://wa.me/5521999991234");
    await expect(
      page.getByRole("link", { name: "@casasolidaria" }),
    ).toHaveAttribute("href", "https://instagram.com/casasolidaria");

    await expect(page.getByText("Seg a Qua")).toBeVisible();
    await expect(page.getByText("09:00 às 17:00")).toBeVisible();
    await expect(page.getByText("Sáb")).toBeVisible();

    // a necessidade aberta vira card; a atendida fica no histórico
    const abertas = page.getByRole("region", { name: "Precisa agora" });
    await expect(abertas.getByText("Cestas básicas")).toBeVisible();
    // no perfil da própria ONG o card não repete o nome dela
    await expect(abertas.getByText("Casa Solidária")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Já atendidas (1)" }),
    ).toBeVisible();

    const follow = page.getByRole("button", { name: "Seguir" });
    await expect(follow).toHaveAttribute("aria-pressed", "false");
    await follow.click();

    await expect(page.getByText(/Avisaremos quando ela publicar/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Seguindo" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(state.follows).toEqual([{ donor_id: USER_ID, ong_id: ONG_ID }]);

    await page.getByRole("button", { name: "Seguindo" }).click();

    await expect(page.getByText("Você deixou de seguir esta instituição")).toBeVisible();
    await expect(page.getByRole("button", { name: "Seguir" })).toBeVisible();
    expect(state.follows).toEqual([]);
  });

  test("ONG que a RLS esconde cai no aviso de não encontrada", async ({
    page,
  }) => {
    await setupSupabaseMocks(page, { profile: donorProfile, ongProfile: null });

    await page.goto("/login");
    await login(page);
    await page.goto(`/ongs/${ONG_ID}`);

    await expect(
      page.getByRole("heading", { name: "Instituição não encontrada" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Ver necessidades" }).click();
    await expect(page).toHaveURL(/\/necessidades$/);
  });
});

test.describe("Horários de funcionamento", () => {
  const ongAccount: ProfileRow = {
    id: USER_ID,
    user_type: "ong",
    name: "Ana E2E",
    phone: null,
    created_at: new Date().toISOString(),
  };

  const approvedOng: OngRow = {
    id: ONG_ID,
    trade_name: "Casa Solidária",
    verification_status: "approved",
  };

  test("ONG preenche os horários pelo painel", async ({ page }) => {
    const state = await setupSupabaseMocks(page, {
      profile: ongAccount,
      ong: approvedOng,
    });

    await page.goto("/login");
    await login(page);

    await page.getByRole("link", { name: "Horários" }).click();
    await expect(page).toHaveURL(/\/painel\/horarios$/);

    await page.getByRole("checkbox", { name: "Segunda" }).click();
    await page.getByLabel("Segunda: abre às").fill("08:00");
    await page.getByLabel("Segunda: fecha às").fill("12:00");
    await page.getByRole("checkbox", { name: "Sábado" }).click();
    await page.getByLabel("Sábado: abre às").fill("09:00");
    await page.getByLabel("Sábado: fecha às").fill("13:00");
    await page.getByRole("button", { name: "Salvar horários" }).click();

    await expect(page.getByText("Horários atualizados")).toBeVisible();
    expect(state.openingHours).toEqual([
      {
        ong_id: ONG_ID,
        weekday: 1,
        opens_at: "08:00",
        closes_at: "12:00",
      },
      {
        ong_id: ONG_ID,
        weekday: 6,
        opens_at: "09:00",
        closes_at: "13:00",
      },
    ]);
  });

  test("não salva dia marcado sem horário", async ({ page }) => {
    const state = await setupSupabaseMocks(page, {
      profile: ongAccount,
      ong: approvedOng,
    });

    await page.goto("/login");
    await login(page);
    await page.goto("/painel/horarios");

    await page.getByRole("checkbox", { name: "Quinta" }).click();
    await page.getByRole("button", { name: "Salvar horários" }).click();

    await expect(page.getByText(/abertura e de fechamento/)).toBeVisible();
    expect(state.openingHours).toEqual([]);
  });
});
