import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useOngNeeds } from "@/features/needs";
import type { NeedWithCategory } from "@/features/needs";
import { useOngProfile } from "../hooks/useOngProfile";
import type { OngProfile } from "../model/ong";
import OngProfilePage from "./OngProfilePage";

vi.mock("../hooks/useOngProfile");

// o card e a regra de "ainda dá para atender" entram de verdade; só a busca
// das necessidades da ONG é mockada
vi.mock("@/features/needs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/needs")>()),
  useOngNeeds: vi.fn(),
}));

vi.mock("../components/FollowOngButton", () => ({
  FollowOngButton: ({ ongId }: { ongId: string }) => (
    <button type="button">Seguir {ongId}</button>
  ),
}));

const ong: OngProfile = {
  id: "ong-1",
  profile_id: "user-1",
  trade_name: "Casa Solidária",
  legal_name: "Associação Casa Solidária",
  cnpj: "12345678000195",
  mission: "Acolher famílias em situação de rua",
  neighborhood: "Centro",
  address: "Rua das Flores, 10",
  instagram: "@casasolidaria",
  facebook: null,
  website: null,
  verification_status: "approved",
  created_at: "2026-09-10T12:00:00Z",
  city: { name: "Rio de Janeiro" },
  state: { uf: "RJ" },
  contacts: [{ id: "c-1", number: "21999991234", whatsapp: true }],
  opening_hours: [
    { weekday: 1, opens_at: "09:00:00", closes_at: "17:00:00" },
    { weekday: 2, opens_at: "09:00:00", closes_at: "17:00:00" },
  ],
};

function need(overrides: Partial<NeedWithCategory> = {}): NeedWithCategory {
  return {
    id: "need-1",
    ong_id: "ong-1",
    category_id: "cat-1",
    title: "Cestas básicas",
    description: null,
    quantity: 30,
    urgency: "high",
    deadline: null,
    status: "open",
    created_at: "2026-09-10T12:00:00Z",
    updated_at: "2026-09-10T12:00:00Z",
    category: { id: "cat-1", name: "Alimentos" },
    ...overrides,
  };
}

function mockProfile(overrides: Record<string, unknown> = {}) {
  const result = {
    data: ong,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  };

  vi.mocked(useOngProfile).mockReturnValue(result as never);
  return result;
}

function mockNeeds(overrides: Record<string, unknown> = {}) {
  const result = {
    data: [] as NeedWithCategory[],
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
    <MemoryRouter initialEntries={["/ongs/ong-1"]}>
      <Routes>
        <Route path="/ongs/:id" element={<OngProfilePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("OngProfilePage", () => {
  it("mostra a instituição, contatos e endereço", () => {
    mockProfile();
    mockNeeds();
    renderPage();

    expect(useOngProfile).toHaveBeenCalledWith("ong-1");
    expect(
      screen.getByRole("heading", { name: "Casa Solidária" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Associação Casa Solidária")).toBeInTheDocument();
    expect(screen.getByText("Centro, Rio de Janeiro - RJ")).toBeInTheDocument();
    expect(
      screen.getByText("Acolher famílias em situação de rua"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Rua das Flores, 10 — Centro, Rio de Janeiro - RJ"),
    ).toBeInTheDocument();
    expect(screen.getByText("CNPJ 12.345.678/0001-95")).toBeInTheDocument();
    expect(screen.getByText("Seg e Ter")).toBeInTheDocument();
    expect(screen.getByText("09:00 às 17:00")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /\(21\) 99999-1234/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Seguir ong-1" }),
    ).toBeInTheDocument();
  });

  it("separa o que ainda dá para atender do que já foi atendido", () => {
    mockProfile();
    mockNeeds({
      data: [
        need(),
        need({ id: "need-2", title: "Cobertores", status: "fulfilled" }),
        need({ id: "need-3", title: "Vencida", deadline: "2020-01-01" }),
      ],
    });
    renderPage();

    const abertas = screen.getByRole("region", { name: "Precisa agora" });
    expect(
      within(abertas).getByRole("link", { name: /Cestas básicas/ }),
    ).toHaveAttribute("href", "/necessidades/need-1");
    // o card no perfil da própria ONG não repete o nome dela
    expect(
      within(abertas).queryByText("Casa Solidária"),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Já atendidas (1)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Cobertores" }),
    ).toBeInTheDocument();

    // necessidade com prazo vencido não entra em nenhuma das duas listas
    expect(screen.queryByText("Vencida")).not.toBeInTheDocument();
  });

  it("convida a seguir quando não há necessidade aberta", () => {
    mockProfile();
    mockNeeds({ data: [need({ status: "fulfilled" })] });
    renderPage();

    expect(
      screen.getByText(/Nenhuma necessidade aberta no momento/),
    ).toBeInTheDocument();
  });

  it("avisa quando a ONG não informou horários", () => {
    mockProfile({ data: { ...ong, opening_hours: [] } });
    mockNeeds();
    renderPage();

    expect(
      screen.getByText(/ainda não informou os horários/),
    ).toBeInTheDocument();
  });

  it("avisa a própria ONG quando o cadastro está em análise", () => {
    mockProfile({ data: { ...ong, verification_status: "pending" } });
    mockNeeds();
    renderPage();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Cadastro em análise.",
    );
  });

  it("avisa quando o cadastro não foi aprovado", () => {
    mockProfile({ data: { ...ong, verification_status: "rejected" } });
    mockNeeds();
    renderPage();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Cadastro não aprovado.",
    );
  });

  it("explica quando a ONG não existe ou não está verificada", () => {
    mockProfile({ data: null });
    mockNeeds();
    renderPage();

    expect(
      screen.getByRole("heading", { name: "Instituição não encontrada" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ver necessidades" }),
    ).toHaveAttribute("href", "/necessidades");
  });

  it("deixa tentar de novo quando o perfil falha", async () => {
    const result = mockProfile({ data: undefined, isError: true });
    mockNeeds();
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(result.refetch).toHaveBeenCalled();
  });

  it("deixa tentar de novo quando as necessidades falham", async () => {
    mockProfile();
    const needs = mockNeeds({ data: undefined, isError: true });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(needs.refetch).toHaveBeenCalled();
  });
});
