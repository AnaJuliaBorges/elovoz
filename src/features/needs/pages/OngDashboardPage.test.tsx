import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { useMyOng } from "@/features/ongs";
import { useOngNeeds } from "../hooks/useNeedQueries";
import OngDashboardPage from "./OngDashboardPage";

vi.mock("@/features/ongs");
vi.mock("../hooks/useNeedQueries");
vi.mock("../components/OngNeedItem", () => ({
  OngNeedItem: ({ need }: { need: { title: string } }) => <p>{need.title}</p>,
}));

function mockOng(overrides: Record<string, unknown> = {}) {
  const result = {
    data: {
      id: "ong-1",
      trade_name: "Casa Solidária",
      verification_status: "approved",
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  };

  vi.mocked(useMyOng).mockReturnValue(result as never);
  return result;
}

function mockNeeds(overrides: Record<string, unknown> = {}) {
  const result = {
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  };

  vi.mocked(useOngNeeds).mockReturnValue(result as never);
  return result;
}

function renderPage() {
  render(
    <MemoryRouter>
      <OngDashboardPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("OngDashboardPage", () => {
  it("lista as necessidades da ONG aprovada", () => {
    mockOng();
    mockNeeds({ data: [{ id: "need-1", title: "Cestas básicas" }] });
    renderPage();

    expect(useOngNeeds).toHaveBeenCalledWith("ong-1");
    expect(screen.getByText("Casa Solidária")).toBeInTheDocument();
    expect(screen.getByText("Cestas básicas")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Nova necessidade" }),
    ).toHaveAttribute("href", "/painel/necessidades/nova");
  });

  it("convida a publicar a primeira quando não há nenhuma", () => {
    mockOng();
    mockNeeds();
    renderPage();

    expect(
      screen.getByRole("heading", { name: "Nenhuma necessidade publicada" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Publicar a primeira" }),
    ).toHaveAttribute("href", "/painel/necessidades/nova");
  });

  it("deixa tentar de novo quando a lista falha", async () => {
    mockOng();
    const needs = mockNeeds({ data: undefined, isError: true });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(needs.refetch).toHaveBeenCalled();
  });

  it("avisa a ONG em análise e não oferece publicar", () => {
    mockOng({
      data: {
        id: "ong-1",
        trade_name: "Casa Solidária",
        verification_status: "pending",
      },
    });
    mockNeeds();
    renderPage();

    expect(screen.getByRole("status")).toHaveTextContent("Cadastro em análise");
    expect(
      screen.queryByRole("link", { name: "Nova necessidade" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Nenhuma necessidade publicada"),
    ).not.toBeInTheDocument();
  });

  it("avisa a ONG recusada", () => {
    mockOng({
      data: {
        id: "ong-1",
        trade_name: "Casa Solidária",
        verification_status: "rejected",
      },
    });
    mockNeeds();
    renderPage();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Cadastro não aprovado",
    );
    expect(
      screen.queryByRole("link", { name: "Nova necessidade" }),
    ).not.toBeInTheDocument();
  });

  it("explica quando o perfil não tem ONG", () => {
    mockOng({ data: null });
    mockNeeds();
    renderPage();

    expect(
      screen.getByText(/Não encontramos os dados da sua instituição/),
    ).toBeInTheDocument();
  });

  it("deixa tentar de novo quando a ONG não carrega", async () => {
    const ong = mockOng({ data: undefined, isError: true });
    mockNeeds();
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(ong.refetch).toHaveBeenCalled();
  });
});
