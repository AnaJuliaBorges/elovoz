import { test, expect } from "@playwright/test";
import {
  ONG_ID,
  USER_ID,
  interestRow,
  login,
  needRow,
  setupSupabaseMocks,
  type OngRow,
  type ProfileRow,
} from "./supabaseMocks";

const base = {
  id: USER_ID,
  name: "Ana E2E",
  phone: null,
  created_at: new Date().toISOString(),
};

const donorProfile: ProfileRow = { ...base, user_type: "donor" };
const ongProfile: ProfileRow = { ...base, user_type: "ong" };

const approvedOng: OngRow = {
  id: ONG_ID,
  trade_name: "Casa Solidária",
  verification_status: "approved",
};

test.describe("Interesse do doador", () => {
  test("doadora manifesta interesse e depois cancela", async ({ page }) => {
    const state = await setupSupabaseMocks(page, {
      profile: donorProfile,
      needs: [needRow()],
    });

    await page.goto("/login");
    await login(page);
    await page.getByRole("link", { name: /Cestas básicas/ }).click();

    await page.getByRole("button", { name: "Tenho interesse" }).click();
    await page
      .getByLabel("Mensagem para a instituição")
      .fill("Tenho 10 cestas, falo pelo (21) 99999-1234");
    await page.getByLabel("Quantidade (opcional)").fill("10");
    await page.getByRole("button", { name: "Enviar interesse" }).click();

    await expect(
      page.getByText("Interesse enviado para a instituição"),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Você manifestou interesse/ }),
    ).toBeVisible();
    await expect(page.getByText("Quantidade: 10")).toBeVisible();

    expect(state.interests).toEqual([
      expect.objectContaining({
        need_id: "need-1",
        donor_id: USER_ID,
        message: "Tenho 10 cestas, falo pelo (21) 99999-1234",
        expected_quantity: 10,
        expected_deadline: null,
      }),
    ]);

    await page.getByRole("button", { name: "Cancelar interesse" }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Cancelar interesse" })
      .click();

    await expect(page.getByText("Interesse cancelado")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Tenho interesse" }),
    ).toBeVisible();
    expect(state.interests).toEqual([]);
  });

  test("ONG vê no detalhe quem quer doar", async ({ page }) => {
    await setupSupabaseMocks(page, {
      profile: ongProfile,
      ong: approvedOng,
      needs: [needRow()],
      interests: [interestRow({ donor_id: "outra-pessoa" })],
    });

    await page.goto("/login");
    await login(page);

    await page.getByRole("link", { name: "Cestas básicas" }).click();

    await expect(
      page.getByRole("heading", { name: "1 pessoa quer doar" }),
    ).toBeVisible();
    await expect(
      page.getByText("Tenho 10 cestas, falo pelo (21) 99999-1234"),
    ).toBeVisible();
    // a ONG não manifesta interesse na própria necessidade
    await expect(
      page.getByRole("button", { name: "Tenho interesse" }),
    ).toHaveCount(0);
  });
});
