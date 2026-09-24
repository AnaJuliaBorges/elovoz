import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { OngContactFormInput } from "../model/ongForm";
import { OngContactForm } from "./OngContactForm";

vi.mock("@/hooks/useLocations", () => ({
  useStates: () => ({ data: [{ id: "uf-rj", uf: "RJ", name: "Rio de Janeiro" }] }),
  useCities: () => ({ data: [{ id: "rio", name: "Rio de Janeiro" }] }),
}));

const values: OngContactFormInput = {
  state_id: "uf-rj",
  city_id: "rio",
  neighborhood: "Centro",
  address: "Rua das Flores, 100",
  contacts: [{ number: "(21) 99876-5432", whatsapp: true }],
  instagram: "",
  facebook: "",
  website: "",
};

describe("OngContactForm", () => {
  it("no painel, só tem o botão de salvar e envia o que já estava salvo", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <OngContactForm
        defaultValues={values}
        onSubmit={onSubmit}
        submitLabel="Salvar endereço e contatos"
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Voltar" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Salvar endereço e contatos" }),
    );

    expect(onSubmit).toHaveBeenCalledWith(values, expect.anything());
  });

  it("no cadastro, mostra o Voltar", async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();

    render(
      <OngContactForm
        defaultValues={values}
        onSubmit={vi.fn()}
        onBack={onBack}
        submitLabel="Continuar"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Voltar" }));

    expect(onBack).toHaveBeenCalled();
  });

  it("desliga o salvar enquanto grava", () => {
    render(
      <OngContactForm
        defaultValues={values}
        onSubmit={vi.fn()}
        submitLabel="Salvando..."
        submitting
      />,
    );

    expect(screen.getByRole("button", { name: "Salvando..." })).toBeDisabled();
  });
});
