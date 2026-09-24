import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OngIdentityForm } from "./OngIdentityForm";

const MISSION = "Distribuir alimentos para famílias em situação de rua.";

function setup() {
  const onSubmit = vi.fn();

  render(
    <OngIdentityForm
      defaultValues={{ trade_name: "Casa Solidária", mission: MISSION }}
      legalName="Associação Casa Solidária"
      cnpj="11222333000181"
      onSubmit={onSubmit}
    />,
  );

  return { onSubmit };
}

describe("OngIdentityForm", () => {
  it("abre com os dados salvos e trava razão social e CNPJ", () => {
    setup();

    expect(screen.getByLabelText("Nome fantasia")).toHaveValue(
      "Casa Solidária",
    );
    expect(screen.getByLabelText("Razão social")).toBeDisabled();
    expect(screen.getByLabelText("CNPJ")).toHaveValue("11.222.333/0001-81");
    expect(screen.getByLabelText("CNPJ")).toBeDisabled();
  });

  it("salva nome fantasia e missão", async () => {
    const { onSubmit } = setup();
    const user = userEvent.setup();

    await user.clear(screen.getByLabelText("Nome fantasia"));
    await user.type(screen.getByLabelText("Nome fantasia"), "Casa Nova");
    await user.click(
      screen.getByRole("button", { name: "Salvar identificação" }),
    );

    expect(onSubmit).toHaveBeenCalledWith(
      { trade_name: "Casa Nova", mission: MISSION },
      expect.anything(),
    );
  });

  it("não salva com missão curta", async () => {
    const { onSubmit } = setup();
    const user = userEvent.setup();

    await user.clear(screen.getByLabelText("Missão da ONG"));
    await user.type(screen.getByLabelText("Missão da ONG"), "Ajudar");
    await user.click(
      screen.getByRole("button", { name: "Salvar identificação" }),
    );

    expect(await screen.findByText(/pelo menos 20 caracteres/)).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
