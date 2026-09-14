import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useSearchNeeds } from "../hooks/useNeedQueries";
import type { NeedFilters, NeedWithOng } from "../model/need";
import SearchNeedsPage from "./SearchNeedsPage";

vi.mock("../hooks/useNeedQueries");

// os filtros de verdade têm teste próprio: aqui só interessa o contrato
// filtros ↔ URL ↔ busca
vi.mock("../components/NeedFiltersBar", () => ({
  NeedFiltersBar: ({
    filters,
    onChange,
  }: {
    filters: NeedFilters;
    onChange: (filters: NeedFilters) => void;
  }) => (
    <button onClick={() => onChange({ ...filters, urgency: "high" })}>
      só urgentes
    </button>
  ),
}));

const need: NeedWithOng = {
  id: "need-1",
  ong_id: "ong-1",
  category_id: "cat-1",
  title: "Cestas básicas",
  description: null,
  quantity: 30,
  urgency: "high",
  deadline: "2026-10-01",
  status: "open",
  created_at: "2026-09-10T12:00:00Z",
  updated_at: "2026-09-10T12:00:00Z",
  category: { id: "cat-1", name: "Alimentos" },
  ong: {
    id: "ong-1",
    trade_name: "Casa Solidária",
    neighborhood: "Centro",
    city: { name: "Rio de Janeiro" },
    state: { uf: "RJ" },
  },
};

function mockSearch(overrides: Record<string, unknown> = {}) {
  const result = {
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    ...overrides,
  };

  vi.mocked(useSearchNeeds).mockReturnValue(result as never);
  return result;
}

function renderPage(url = "/necessidades") {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/necessidades" element={<SearchNeedsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SearchNeedsPage", () => {
  it("busca com os filtros que vêm na URL", () => {
    mockSearch();
    renderPage("/necessidades?categoria=cat-1&urgencia=low");

    expect(useSearchNeeds).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: "cat-1", urgency: "low" }),
    );
  });

  it("refaz a busca quando os filtros mudam", async () => {
    mockSearch();
    const user = userEvent.setup();
    renderPage("/necessidades?categoria=cat-1");

    await user.click(screen.getByRole("button", { name: "só urgentes" }));

    expect(useSearchNeeds).toHaveBeenLastCalledWith(
      expect.objectContaining({ categoryId: "cat-1", urgency: "high" }),
    );
  });

  it("lista os resultados e carrega mais", async () => {
    const search = mockSearch({
      data: { pages: [{ needs: [need], total: 13 }] },
      hasNextPage: true,
    });
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText("13 necessidades encontradas")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Cestas básicas/ })).toHaveAttribute(
      "href",
      "/necessidades/need-1",
    );
    expect(screen.getByText("Centro, Rio de Janeiro - RJ")).toBeInTheDocument();
    expect(screen.getByText("Até 01/10/2026")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Carregar mais" }));

    expect(search.fetchNextPage).toHaveBeenCalled();
  });

  it("usa o singular com um resultado e esconde o carregar mais no fim", () => {
    mockSearch({ data: { pages: [{ needs: [need], total: 1 }] } });
    renderPage();

    expect(screen.getByText("1 necessidade encontrada")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Carregar mais" }),
    ).not.toBeInTheDocument();
  });

  it("avisa quando nada foi encontrado", () => {
    mockSearch({ data: { pages: [{ needs: [], total: 0 }] } });
    renderPage();

    expect(
      screen.getByRole("heading", { name: "Nenhuma necessidade encontrada" }),
    ).toBeInTheDocument();
  });

  it("deixa tentar de novo quando a busca falha", async () => {
    const search = mockSearch({ isError: true });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(search.refetch).toHaveBeenCalled();
  });
});
