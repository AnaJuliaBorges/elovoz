import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { toast } from "sonner";
import { useMyOng } from "@/features/ongs";
import { useNeed } from "../hooks/useNeedQueries";
import { useUpdateNeed } from "../hooks/useNeedMutations";
import type { NeedFormInput } from "../model/schema";
import EditNeedPage from "./EditNeedPage";

vi.mock("@/features/ongs");
vi.mock("../hooks/useNeedQueries");
vi.mock("../hooks/useNeedMutations");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("../components/NeedForm", () => ({
  NeedForm: ({
    defaultValues,
    onSubmit,
    submitLabel,
  }: {
    defaultValues: NeedFormInput;
    onSubmit: (values: NeedFormInput) => void;
    submitLabel: string;
  }) => (
    <div>
      <p>título atual: {defaultValues.title}</p>
      <button onClick={() => onSubmit({ ...defaultValues, urgency: "low" })}>
        {submitLabel}
      </button>
    </div>
  ),
}));

const need = {
  id: "need-1",
  ong_id: "ong-1",
  category_id: "cat-1",
  title: "Cestas básicas",
  description: null,
  quantity: 30,
  urgency: "high",
  deadline: null,
  status: "open",
};

function mockData({
  needData = need as unknown,
  ongId = "ong-1",
  loading = false,
}: { needData?: unknown; ongId?: string; loading?: boolean } = {}) {
  vi.mocked(useNeed).mockReturnValue({
    data: needData,
    isLoading: loading,
  } as never);
  vi.mocked(useMyOng).mockReturnValue({
    data: { id: ongId, trade_name: "Casa Solidária", verification_status: "approved" },
    isLoading: false,
  } as never);
}

function mockUpdate() {
  const result = {
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
    error: null,
  };

  vi.mocked(useUpdateNeed).mockReturnValue(result as never);
  return result;
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/painel/necessidades/need-1/editar"]}>
      <Routes>
        <Route
          path="/painel/necessidades/:id/editar"
          element={<EditNeedPage />}
        />
        <Route path="/painel" element={<p>painel</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EditNeedPage", () => {
  it("abre o form já preenchido e salva", async () => {
    mockData();
    const update = mockUpdate();
    const user = userEvent.setup();
    renderPage();

    expect(useNeed).toHaveBeenCalledWith("need-1");
    expect(
      screen.getByText("título atual: Cestas básicas"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(update.mutateAsync).toHaveBeenCalledWith({
      id: "need-1",
      values: expect.objectContaining({
        title: "Cestas básicas",
        quantity: "30",
        urgency: "low",
      }),
    });
    expect(await screen.findByText("painel")).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("Necessidade atualizada");
  });

  it("não monta o form enquanto carrega", () => {
    mockData({ needData: undefined, loading: true });
    mockUpdate();
    renderPage();

    expect(
      screen.queryByRole("button", { name: "Salvar alterações" }),
    ).not.toBeInTheDocument();
  });

  it("não deixa editar necessidade de outra ONG", () => {
    mockData({ ongId: "ong-2" });
    mockUpdate();
    renderPage();

    expect(
      screen.getByText("Não encontramos essa necessidade entre as da sua ONG."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Salvar alterações" }),
    ).not.toBeInTheDocument();
  });

  it("trata necessidade inexistente do mesmo jeito", () => {
    mockData({ needData: null });
    mockUpdate();
    renderPage();

    expect(
      screen.getByRole("link", { name: "Voltar ao painel" }),
    ).toHaveAttribute("href", "/painel");
  });
});
