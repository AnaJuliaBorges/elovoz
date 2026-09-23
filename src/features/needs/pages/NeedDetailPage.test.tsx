import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useProfile } from "@/features/auth";
import { useMyOng } from "@/features/ongs";
import { useNeed } from "../hooks/useNeedQueries";
import type { NeedWithOng } from "../model/need";
import NeedDetailPage from "./NeedDetailPage";

vi.mock("../hooks/useNeedQueries");
vi.mock("@/features/auth");
vi.mock("@/features/ongs");

// as seções de interesse têm teste próprio; aqui só importa quem as vê
vi.mock("@/features/donations", () => ({
  DonorInterestSection: ({ accepting }: { accepting: boolean }) => (
    <p>interesse do doador (aceitando: {String(accepting)})</p>
  ),
  NeedInterestsList: () => <p>interesses recebidos</p>,
}));

const need: NeedWithOng = {
  id: "need-1",
  ong_id: "ong-1",
  category_id: "cat-1",
  title: "Cestas básicas",
  description: "Para 30 famílias do bairro",
  quantity: 30,
  urgency: "high",
  deadline: "2026-10-01",
  status: "partially_fulfilled",
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

function mockNeed(overrides: Record<string, unknown> = {}) {
  const result = {
    data: need,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  };

  vi.mocked(useNeed).mockReturnValue(result as never);
  return result;
}

function mockViewer(userType: "donor" | "ong", ongId?: string) {
  vi.mocked(useProfile).mockReturnValue({
    data: { user_type: userType },
  } as never);
  vi.mocked(useMyOng).mockReturnValue({
    data: ongId ? { id: ongId } : undefined,
  } as never);
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/necessidades/need-1"]}>
      <Routes>
        <Route path="/necessidades/:id" element={<NeedDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("NeedDetailPage", () => {
  it("mostra a necessidade e quem precisa", () => {
    mockNeed();
    mockViewer("donor");
    renderPage();

    expect(useNeed).toHaveBeenCalledWith("need-1");
    expect(useMyOng).toHaveBeenCalledWith({ enabled: false });
    expect(
      screen.getByRole("heading", { name: "Cestas básicas" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Para 30 famílias do bairro")).toBeInTheDocument();
    expect(screen.getByText("Parcialmente atendida")).toBeInTheDocument();
    expect(screen.getByText("01/10/2026")).toBeInTheDocument();
    expect(screen.getByText("Casa Solidária")).toBeInTheDocument();
    expect(screen.getByText("Centro, Rio de Janeiro - RJ")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ver perfil da ONG" }),
    ).toHaveAttribute("href", "/ongs/ong-1");
    expect(
      screen.queryByRole("link", { name: /Editar necessidade/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("interesse do doador (aceitando: true)"),
    ).toBeInTheDocument();
    expect(screen.queryByText("interesses recebidos")).not.toBeInTheDocument();
  });

  it("não convida a doar quando a necessidade já foi atendida", () => {
    mockNeed({ data: { ...need, status: "fulfilled" } });
    mockViewer("donor");
    renderPage();

    expect(
      screen.getByText("interesse do doador (aceitando: false)"),
    ).toBeInTheDocument();
  });

  it("mostra a edição e os interesses recebidos só para a ONG dona", () => {
    mockNeed();
    mockViewer("ong", "ong-1");
    renderPage();

    expect(useMyOng).toHaveBeenCalledWith({ enabled: true });
    expect(screen.getByText("interesses recebidos")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Editar necessidade/ }),
    ).toHaveAttribute("href", "/painel/necessidades/need-1/editar");
  });

  it("não mostra a edição nem os interesses para outra ONG", () => {
    mockNeed();
    mockViewer("ong", "ong-2");
    renderPage();

    expect(
      screen.queryByRole("link", { name: /Editar necessidade/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("interesses recebidos")).not.toBeInTheDocument();
  });

  it("explica quando falta quantidade e prazo", () => {
    mockNeed({ data: { ...need, quantity: null, deadline: null } });
    mockViewer("donor");
    renderPage();

    expect(screen.getByText("Não informada")).toBeInTheDocument();
    expect(screen.getByText("Sem prazo")).toBeInTheDocument();
  });

  it("avisa quando a necessidade não existe", () => {
    mockNeed({ data: null });
    mockViewer("donor");
    renderPage();

    expect(
      screen.getByRole("heading", { name: "Necessidade não encontrada" }),
    ).toBeInTheDocument();
  });

  it("deixa tentar de novo quando falha", async () => {
    const result = mockNeed({ data: undefined, isError: true });
    mockViewer("donor");
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(result.refetch).toHaveBeenCalled();
  });
});
