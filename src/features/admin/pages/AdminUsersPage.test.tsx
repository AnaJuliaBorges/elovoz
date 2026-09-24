import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useProfile } from "@/features/auth";
import { useAdminUsers } from "../hooks/useAdminUsers";
import type { AdminUser } from "../model/user";
import AdminUsersPage from "./AdminUsersPage";

vi.mock("@/features/auth");
vi.mock("../hooks/useAdminUsers");
vi.mock("../components/UserCard", () => ({
  UserCard: ({ user, canDelete }: { user: AdminUser; canDelete: boolean }) => (
    <p>
      card de {user.name ?? user.email}
      {canDelete ? " (excluível)" : ""}
    </p>
  ),
}));

function userWith(overrides: Partial<AdminUser>): AdminUser {
  return {
    id: "u",
    email: null,
    name: null,
    phone: null,
    user_type: "donor",
    created_at: "2026-09-20T12:00:00Z",
    last_sign_in_at: null,
    ong_id: null,
    ong_trade_name: null,
    ong_status: null,
    ...overrides,
  };
}

const users = [
  userWith({ id: "d", name: "José" }),
  userWith({ id: "o", name: "Maria", user_type: "ong" }),
  userWith({ id: "me", name: "Eu Admin", user_type: "admin" }),
];

function setup({
  data = users as AdminUser[] | null,
  isLoading = false,
  isError = false,
} = {}) {
  vi.mocked(useProfile).mockReturnValue({ data: { id: "me" } } as never);

  const refetch = vi.fn();
  vi.mocked(useAdminUsers).mockReturnValue({
    data,
    isLoading,
    isError,
    refetch,
  } as never);

  render(<AdminUsersPage />);

  return { refetch };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AdminUsersPage", () => {
  it("lista todo mundo, com as contagens nos filtros", () => {
    setup();

    expect(screen.getByRole("button", { name: "Todos (3)" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "ONGs (1)" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Incompletos (0)" }),
    ).toBeInTheDocument();
    expect(screen.getByText("card de José (excluível)")).toBeInTheDocument();
    // o próprio admin nunca é excluível
    expect(screen.getByText("card de Eu Admin")).toBeInTheDocument();
  });

  it("filtra por papel", async () => {
    setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "ONGs (1)" }));

    expect(screen.getByText(/card de Maria/)).toBeInTheDocument();
    expect(screen.queryByText(/card de José/)).not.toBeInTheDocument();
  });

  it("busca pelo nome e avisa quando não acha", async () => {
    setup();
    const user = userEvent.setup();
    const search = screen.getByRole("searchbox", {
      name: "Buscar por nome, e-mail ou ONG",
    });

    await user.type(search, "jose");
    expect(screen.getByText(/card de José/)).toBeInTheDocument();
    expect(screen.queryByText(/card de Maria/)).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "ninguém");
    expect(screen.getByText("Nenhuma conta encontrada.")).toBeInTheDocument();
  });

  it("não mostra lista enquanto carrega", () => {
    setup({ data: null, isLoading: true });

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Nenhuma conta encontrada."),
    ).not.toBeInTheDocument();
  });

  it("deixa tentar de novo quando a busca falha", async () => {
    const { refetch } = setup({ data: null, isError: true });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(refetch).toHaveBeenCalled();
  });
});
