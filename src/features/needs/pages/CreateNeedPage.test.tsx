import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { toast } from "sonner";
import { useMyOng } from "@/features/ongs";
import { useCreateNeed } from "../hooks/useNeedMutations";
import type { NeedFormInput } from "../model/schema";
import CreateNeedPage from "./CreateNeedPage";

vi.mock("@/features/ongs");
vi.mock("../hooks/useNeedMutations");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// o form de verdade tem teste próprio: aqui só o que a página faz com o envio
vi.mock("../components/NeedForm", () => ({
  NeedForm: ({
    defaultValues,
    onSubmit,
    submitLabel,
    error,
  }: {
    defaultValues: NeedFormInput;
    onSubmit: (values: NeedFormInput) => void;
    submitLabel: string;
    error: string | null;
  }) => (
    <div>
      {error && <p role="alert">{error}</p>}
      <button
        onClick={() =>
          onSubmit({ ...defaultValues, title: "Cestas", category_id: "cat-1" })
        }
      >
        {submitLabel}
      </button>
    </div>
  ),
}));

function mockOng(verificationStatus: string) {
  vi.mocked(useMyOng).mockReturnValue({
    data: { id: "ong-1", trade_name: "Casa Solidária", verification_status: verificationStatus },
    isLoading: false,
  } as never);
}

function mockCreate(overrides: Record<string, unknown> = {}) {
  const result = {
    mutateAsync: vi.fn().mockResolvedValue("need-1"),
    isPending: false,
    error: null,
    ...overrides,
  };

  vi.mocked(useCreateNeed).mockReturnValue(result as never);
  return result;
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/painel/necessidades/nova"]}>
      <Routes>
        <Route path="/painel/necessidades/nova" element={<CreateNeedPage />} />
        <Route path="/painel" element={<p>painel</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CreateNeedPage", () => {
  it("publica e volta para o painel", async () => {
    mockOng("approved");
    const create = mockCreate();
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("button", { name: "Publicar necessidade" }),
    );

    expect(create.mutateAsync).toHaveBeenCalledWith({
      ongId: "ong-1",
      values: expect.objectContaining({ title: "Cestas", category_id: "cat-1" }),
    });
    expect(await screen.findByText("painel")).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("Necessidade publicada");
  });

  it("fica no form e mostra o erro quando falha", async () => {
    mockOng("approved");
    const create = mockCreate({
      mutateAsync: vi.fn().mockRejectedValue({ code: "42501" }),
      error: { code: "42501" },
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("button", { name: "Publicar necessidade" }),
    );

    expect(create.mutateAsync).toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Sua ONG precisa estar aprovada para publicar necessidades.",
    );
    expect(screen.queryByText("painel")).not.toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("não mostra o form para ONG ainda não aprovada", () => {
    mockOng("pending");
    mockCreate();
    renderPage();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Sua ONG precisa estar aprovada",
    );
    expect(
      screen.queryByRole("button", { name: "Publicar necessidade" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Voltar ao painel" }),
    ).toHaveAttribute("href", "/painel");
  });
});
