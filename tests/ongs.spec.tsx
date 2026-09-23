import { test, expect } from "@playwright/test";
import {
  ONG_ID,
  USER_ID,
  login,
  needRow,
  ongProfileRow,
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
