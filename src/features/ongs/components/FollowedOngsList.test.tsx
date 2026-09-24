import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { toast } from "sonner";
import { useFollowedOngs, useToggleFollowOng } from "../hooks/useFollowOng";
import type { FollowedOng } from "../model/ong";
import { FollowedOngsList } from "./FollowedOngsList";

vi.mock("../hooks/useFollowOng");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

type MutateOptions = {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

const ong: FollowedOng = {
  id: "ong-1",
  trade_name: "Casa Esperança",
  neighborhood: "Centro",
  city: { name: "Rio de Janeiro" },
  state: { uf: "RJ" },
};

function setup({
  data = [ong] as FollowedOng[] | undefined,
  isLoading = false,
  isError = false,
} = {}) {
  const refetch = vi.fn();
  vi.mocked(useFollowedOngs).mockReturnValue({
    data,
    isLoading,
    isError,
    refetch,
  } as never);

  const mutate = vi.fn();
  vi.mocked(useToggleFollowOng).mockReturnValue({
    mutate,
    isPending: false,
  } as never);

  render(
    <MemoryRouter>
      <FollowedOngsList />
    </MemoryRouter>,
  );

  return { mutate, refetch };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("FollowedOngsList", () => {
  it("mostra a ONG com link para o perfil e a localização", () => {
    setup();

    expect(screen.getByRole("link", { name: "Casa Esperança" })).toHaveAttribute(
      "href",
      "/ongs/ong-1",
    );
    expect(
      screen.getByText("Centro, Rio de Janeiro - RJ"),
    ).toBeInTheDocument();
  });

  it("deixa de seguir pela lista", async () => {
    const { mutate } = setup();
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: "Deixar de seguir Casa Esperança" }),
    );

    expect(mutate).toHaveBeenCalledWith(true, expect.anything());

    const [, options] = mutate.mock.calls[0] as [boolean, MutateOptions];
    options.onSuccess?.();
    expect(toast.success).toHaveBeenCalledWith(
      "Você deixou de seguir Casa Esperança",
    );

    options.onError?.(new Error("rede"));
    expect(toast.error).toHaveBeenCalled();
  });

  it("orienta quando não segue ninguém", () => {
    setup({ data: [] });

    expect(
      screen.getByText("Você ainda não segue nenhuma instituição"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Buscar necessidades" }),
    ).toHaveAttribute("href", "/necessidades");
  });

  it("não mostra lista enquanto carrega", () => {
    setup({ data: undefined, isLoading: true });

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("deixa tentar de novo quando a busca falha", async () => {
    const { refetch } = setup({ data: undefined, isError: true });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(refetch).toHaveBeenCalled();
  });
});
