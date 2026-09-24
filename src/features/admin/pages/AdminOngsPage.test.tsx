import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { OngForReview, VerificationStatus } from "@/features/ongs";
import { useOngsForReview } from "../hooks/useOngReview";
import AdminOngsPage from "./AdminOngsPage";

vi.mock("../hooks/useOngReview");
vi.mock("../components/OngReviewCard", () => ({
  OngReviewCard: ({ ong }: { ong: OngForReview }) => (
    <p>card de {ong.trade_name}</p>
  ),
}));

function ongWith(name: string, status: VerificationStatus): OngForReview {
  return {
    id: name,
    trade_name: name,
    verification_status: status,
  } as OngForReview;
}

function setup({
  data = [
    ongWith("Casa A", "pending"),
    ongWith("Casa B", "pending"),
    ongWith("Casa C", "approved"),
  ] as OngForReview[] | null,
  isLoading = false,
  isError = false,
} = {}) {
  const refetch = vi.fn();
  vi.mocked(useOngsForReview).mockReturnValue({
    data,
    isLoading,
    isError,
    refetch,
  } as never);

  render(<AdminOngsPage />);

  return { refetch };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AdminOngsPage", () => {
  it("abre nas pendentes, com as contagens nas abas", () => {
    setup();

    expect(screen.getByRole("tab", { name: "Pendentes (2)" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Aprovadas (1)" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Recusadas (0)" })).toBeInTheDocument();
    expect(screen.getByText("card de Casa A")).toBeInTheDocument();
    expect(screen.getByText("card de Casa B")).toBeInTheDocument();
    expect(screen.queryByText("card de Casa C")).not.toBeInTheDocument();
  });

  it("troca de aba e mostra o vazio de cada status", async () => {
    setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole("tab", { name: "Aprovadas (1)" }));
    expect(screen.getByText("card de Casa C")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Recusadas (0)" }));
    expect(
      screen.getByText("Nenhuma instituição recusada."),
    ).toBeInTheDocument();
  });

  it("não mostra abas enquanto carrega", () => {
    setup({ data: null, isLoading: true });

    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("deixa tentar de novo quando a busca falha", async () => {
    const { refetch } = setup({ data: null, isError: true });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(refetch).toHaveBeenCalled();
  });
});
