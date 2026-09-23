import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCategories } from "../hooks/useCategories";
import { emptyNeedForm } from "../model/schema";
import { NeedForm } from "./NeedForm";

vi.mock("../hooks/useCategories");

const categories = [
  { id: "cat-1", name: "Alimentos", icon: null },
  { id: "cat-2", name: "Livros", icon: null },
];

function renderForm(props: Partial<ComponentProps<typeof NeedForm>> = {}) {
  const onSubmit = vi.fn();

  render(
    <NeedForm
      defaultValues={emptyNeedForm}
      onSubmit={onSubmit}
      submitting={false}
      submitLabel="Publicar necessidade"
      error={null}
      {...props}
    />,
  );

  return { onSubmit };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useCategories).mockReturnValue({ data: categories } as never);
});

describe("NeedForm", () => {
  it("não envia sem título e categoria", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.click(
      screen.getByRole("button", { name: "Publicar necessidade" }),
    );

    expect(
      await screen.findByText("Dê um título com pelo menos 3 caracteres"),
    ).toBeInTheDocument();
    // placeholder do select + mensagem de erro
    expect(screen.getAllByText("Escolha a categoria")).toHaveLength(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("parte dos valores recebidos e envia o que foi alterado", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({
      defaultValues: {
        ...emptyNeedForm,
        title: "Livros infantis",
        category_id: "cat-2",
        quantity: "30",
      },
      submitLabel: "Salvar alterações",
    });

    expect(screen.getByRole("combobox", { name: "Categoria" })).toHaveTextContent(
      "Livros",
    );
    expect(screen.getByRole("radio", { name: "Média" })).toBeChecked();

    await user.click(screen.getByRole("radio", { name: "Alta" }));
    await user.clear(screen.getByRole("textbox", { name: "Título" }));
    await user.type(
      screen.getByRole("textbox", { name: "Título" }),
      "Livros para a biblioteca",
    );
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(onSubmit).toHaveBeenCalledWith(
      {
        title: "Livros para a biblioteca",
        category_id: "cat-2",
        description: "",
        quantity: "30",
        urgency: "high",
        deadline: "",
      },
      expect.anything(),
    );
  });

  it("recusa quantidade que não é inteiro positivo", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({
      defaultValues: { ...emptyNeedForm, title: "Cestas", category_id: "cat-1" },
    });

    await user.type(
      screen.getByRole("textbox", { name: "Quantidade (opcional)" }),
      "0",
    );
    await user.click(
      screen.getByRole("button", { name: "Publicar necessidade" }),
    );

    expect(
      await screen.findByText("Informe um número inteiro maior que zero"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("mostra o erro do servidor e trava o botão enquanto salva", () => {
    renderForm({
      submitting: true,
      error: "Sua ONG precisa estar aprovada para publicar necessidades.",
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Sua ONG precisa estar aprovada",
    );
    expect(screen.getByRole("button", { name: "Salvando..." })).toBeDisabled();
  });
});
