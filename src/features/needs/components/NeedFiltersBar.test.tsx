import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCategories } from "../hooks/useCategories";
import { NeedFiltersBar } from "./NeedFiltersBar";

vi.mock("../hooks/useCategories");
vi.mock("@/hooks/useLocations", () => ({
  useStates: vi.fn(() => ({ data: [] })),
  useCities: vi.fn(() => ({ data: [] })),
}));

const noFilters = {
  categoryId: undefined,
  urgency: undefined,
  stateId: undefined,
  cityId: undefined,
  neighborhood: undefined,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useCategories).mockReturnValue({
    data: [{ id: "cat-1", name: "Alimentos", icon: null }],
  } as never);
});

describe("NeedFiltersBar", () => {
  it("começa com os filtros recebidos", () => {
    const onChange = vi.fn();

    render(
      <NeedFiltersBar
        filters={{ categoryId: "cat-1", urgency: "high" }}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("combobox", { name: "Categoria" })).toHaveTextContent(
      "Alimentos",
    );
    expect(screen.getByRole("combobox", { name: "Urgência" })).toHaveTextContent(
      "Urgência alta",
    );
    expect(onChange).toHaveBeenCalledWith({
      ...noFilters,
      categoryId: "cat-1",
      urgency: "high",
    });
  });

  it("mostra “todas” quando não há filtro", () => {
    render(<NeedFiltersBar filters={{}} onChange={vi.fn()} />);

    expect(screen.getByRole("combobox", { name: "Categoria" })).toHaveTextContent(
      "Todas as categorias",
    );
    expect(screen.getByRole("combobox", { name: "Urgência" })).toHaveTextContent(
      "Qualquer urgência",
    );
    expect(
      screen.queryByRole("button", { name: "Limpar filtros" }),
    ).not.toBeInTheDocument();
  });

  it("filtra por bairro só depois que a pessoa para de digitar", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<NeedFiltersBar filters={{}} onChange={onChange} />);
    onChange.mockClear();

    await user.type(screen.getByRole("textbox", { name: "Bairro" }), "Centro");

    expect(onChange).not.toHaveBeenCalledWith(
      expect.objectContaining({ neighborhood: "C" }),
    );
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith({
        ...noFilters,
        neighborhood: "Centro",
      }),
    );
  });

  it("limpa todos os filtros", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <NeedFiltersBar
        filters={{ categoryId: "cat-1", urgency: "low", neighborhood: "Tijuca" }}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));

    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(noFilters));
    expect(
      screen.queryByRole("button", { name: "Limpar filtros" }),
    ).not.toBeInTheDocument();
  });
});
