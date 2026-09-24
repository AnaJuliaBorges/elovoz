import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { toast } from "sonner";
import type { OngForReview } from "@/features/ongs";
import { useSetOngStatus } from "../hooks/useOngReview";
import { OngReviewCard } from "./OngReviewCard";

vi.mock("../hooks/useOngReview");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

type MutateOptions = {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

const ong: OngForReview = {
  id: "ong-1",
  profile_id: "user-2",
  trade_name: "Casa Esperança",
  legal_name: "Associação Casa Esperança",
  cnpj: "11222333000181",
  mission: "Acolher famílias em situação de vulnerabilidade no Centro.",
  neighborhood: "Centro",
  address: "Rua das Flores, 10",
  instagram: "@casaesperanca",
  facebook: null,
  website: null,
  verification_status: "pending",
  created_at: "2026-09-18T12:00:00Z",
  city: { name: "Rio de Janeiro" },
  state: { uf: "RJ" },
  contacts: [{ id: "c-1", number: "2133334444", whatsapp: false }],
  responsible: { name: "Maria Lima", phone: "21998765432" },
};

function setup(overrides: Partial<OngForReview> = {}) {
  const mutate = vi.fn();
  vi.mocked(useSetOngStatus).mockReturnValue({
    mutate,
    isPending: false,
  } as never);

  render(
    <MemoryRouter>
      <OngReviewCard ong={{ ...ong, ...overrides }} />
    </MemoryRouter>,
  );

  return { mutate };
}

beforeAll(() => {
  // o AlertDialog do Radix usa APIs de ponteiro que o jsdom não implementa
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("OngReviewCard", () => {
  it("mostra o que o admin precisa conferir", () => {
    setup();

    expect(screen.getByText("Casa Esperança")).toBeInTheDocument();
    expect(screen.getByText("Associação Casa Esperança")).toBeInTheDocument();
    expect(screen.getByText("11.222.333/0001-81")).toBeInTheDocument();
    expect(
      screen.getByText("Maria Lima · (21) 99876-5432"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Rua das Flores, 10 — Centro, Rio de Janeiro - RJ"),
    ).toBeInTheDocument();
    expect(screen.getByText("@casaesperanca")).toBeInTheDocument();
    expect(screen.getByText(/Acolher famílias/)).toBeInTheDocument();
    expect(screen.getByText("Cadastrada em 18/09/2026")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver perfil" })).toHaveAttribute(
      "href",
      "/ongs/ong-1",
    );
  });

  it("aprova direto, sem confirmação", async () => {
    const { mutate } = setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Aprovar" }));

    expect(mutate).toHaveBeenCalledWith(
      { id: "ong-1", status: "approved" },
      expect.anything(),
    );

    const [, options] = mutate.mock.calls[0] as [unknown, MutateOptions];
    options.onSuccess?.();
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining("Instituição aprovada"),
    );
  });

  it("pede confirmação antes de recusar", async () => {
    const { mutate } = setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Recusar" }));

    expect(
      screen.getByRole("alertdialog", { name: "Recusar este cadastro?" }),
    ).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Recusar" }));

    expect(mutate).toHaveBeenCalledWith(
      { id: "ong-1", status: "rejected" },
      expect.anything(),
    );
  });

  it("avisa quando a gravação falha", async () => {
    const { mutate } = setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Aprovar" }));

    const [, options] = mutate.mock.calls[0] as [unknown, MutateOptions];
    options.onError?.(new Error("RLS"));
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("Não foi possível atualizar"),
    );
  });

  it("aprovada só oferece revogar", () => {
    setup({ verification_status: "approved" });

    expect(
      screen.getByRole("button", { name: "Revogar aprovação" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Aprovar" }),
    ).not.toBeInTheDocument();
  });

  it("recusada pode ser aprovada", () => {
    setup({ verification_status: "rejected" });

    expect(screen.getByRole("button", { name: "Aprovar" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Recusar" }),
    ).not.toBeInTheDocument();
  });

  it("avisa quando não há responsável legível", () => {
    setup({ responsible: null });

    expect(screen.getByText("Não informado")).toBeInTheDocument();
  });
});
