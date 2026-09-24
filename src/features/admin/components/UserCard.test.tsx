import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { toast } from "sonner";
import { useDeleteUser } from "../hooks/useAdminUsers";
import type { AdminUser } from "../model/user";
import { UserCard } from "./UserCard";

vi.mock("../hooks/useAdminUsers");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

type MutateOptions = {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

const ongUser: AdminUser = {
  id: "u-1",
  email: "maria@teste.com",
  name: "Maria Lima",
  phone: "21998765432",
  user_type: "ong",
  created_at: "2026-09-18T12:00:00Z",
  last_sign_in_at: "2026-09-23T12:00:00Z",
  ong_id: "ong-1",
  ong_trade_name: "Casa Esperança",
  ong_status: "pending",
};

function setup(user: AdminUser = ongUser, canDelete = true) {
  const mutate = vi.fn();
  vi.mocked(useDeleteUser).mockReturnValue({
    mutate,
    isPending: false,
  } as never);

  render(
    <MemoryRouter>
      <UserCard user={user} canDelete={canDelete} />
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

describe("UserCard", () => {
  it("mostra os dados da conta e a ONG com o status", () => {
    setup();

    expect(screen.getByText("Maria Lima")).toBeInTheDocument();
    expect(screen.getByText("ONG")).toBeInTheDocument();
    expect(screen.getByText("maria@teste.com")).toBeInTheDocument();
    expect(screen.getByText("(21) 99876-5432")).toBeInTheDocument();
    expect(
      screen.getByText("Cadastro em 18/09/2026 · Último acesso 23/09/2026"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Casa Esperança" })).toHaveAttribute(
      "href",
      "/ongs/ong-1",
    );
    expect(screen.getByText("(em análise)")).toBeInTheDocument();
  });

  it("marca o cadastro incompleto e usa o e-mail como nome", () => {
    setup({
      ...ongUser,
      name: null,
      phone: null,
      user_type: null,
      last_sign_in_at: null,
      ong_id: null,
      ong_trade_name: null,
      ong_status: null,
    });

    expect(screen.getByText("Cadastro incompleto")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "maria@teste.com" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Último acesso nunca/)).toBeInTheDocument();
  });

  it("pede confirmação, explica o que some e exclui", async () => {
    const { mutate } = setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Excluir conta" }));

    expect(
      screen.getByText(/a instituição e todas as necessidades/),
    ).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Excluir conta" }));

    expect(mutate).toHaveBeenCalledWith("u-1", expect.anything());

    const [, options] = mutate.mock.calls[0] as [string, MutateOptions];
    options.onSuccess?.();
    expect(toast.success).toHaveBeenCalledWith(
      "Conta de Maria Lima excluída",
    );
    options.onError?.(new Error("42501"));
    expect(toast.error).toHaveBeenCalled();
  });

  it("não oferece exclusão quando não é permitida", () => {
    setup({ ...ongUser, user_type: "admin" }, false);

    expect(
      screen.queryByRole("button", { name: "Excluir conta" }),
    ).not.toBeInTheDocument();
  });
});
