import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { useLogout, useProfile, type UserType } from "@/features/auth";
import { useMyOng, type MyOng } from "@/features/ongs";
import { useAccountEmail } from "../hooks/useAccount";
import ProfilePage from "./ProfilePage";

vi.mock("@/features/auth");
vi.mock("@/features/ongs");
vi.mock("../hooks/useAccount");
vi.mock("../components/ProfileForm", () => ({
  ProfileForm: ({ email }: { email: string | null }) => (
    <p>formulário de {email}</p>
  ),
}));
vi.mock("../components/DeleteAccountSection", () => ({
  DeleteAccountSection: ({ userType }: { userType: UserType }) => (
    <p>exclusão para {userType}</p>
  ),
}));

const ong: MyOng = {
  id: "ong-1",
  trade_name: "Casa Esperança",
  verification_status: "approved",
};

function setup({
  userType = "donor" as UserType,
  isLoading = false,
  isError = false,
  myOng = ong as MyOng | null,
} = {}) {
  const refetch = vi.fn();
  vi.mocked(useProfile).mockReturnValue({
    data:
      isLoading || isError ? undefined : { id: "user-1", user_type: userType },
    isLoading,
    isError,
    refetch,
  } as never);
  vi.mocked(useAccountEmail).mockReturnValue({
    data: "ana@teste.com",
    isLoading: false,
  } as never);
  vi.mocked(useMyOng).mockReturnValue({
    data: myOng,
    isLoading: false,
  } as never);

  const logout = vi.fn();
  vi.mocked(useLogout).mockReturnValue(logout);

  render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>,
  );

  return { logout, refetch };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ProfilePage", () => {
  it("mostra dados, privacidade e exclusão para o doador", () => {
    setup();

    expect(screen.getByText("Conta de doador")).toBeInTheDocument();
    expect(screen.getByText("formulário de ana@teste.com")).toBeInTheDocument();
    expect(
      screen.getByText(/Seu nome e seu telefone não aparecem/),
    ).toBeInTheDocument();
    expect(screen.getByText("exclusão para donor")).toBeInTheDocument();
    expect(screen.queryByText("Sua instituição")).not.toBeInTheDocument();
  });

  it("dá atalhos da instituição para a ONG", () => {
    setup({ userType: "ong" });

    expect(screen.getByText("Casa Esperança")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ver perfil público" }),
    ).toHaveAttribute("href", "/ongs/ong-1");
    expect(
      screen.getByRole("link", { name: "Horários de funcionamento" }),
    ).toHaveAttribute("href", "/painel/horarios");
  });

  it("esconde o perfil público enquanto a ONG não é aprovada", () => {
    setup({
      userType: "ong",
      myOng: { ...ong, verification_status: "pending" },
    });

    expect(
      screen.queryByRole("link", { name: "Ver perfil público" }),
    ).not.toBeInTheDocument();
  });

  it("sai da conta pelo botão da página", async () => {
    const { logout } = setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Sair da conta" }));

    expect(logout).toHaveBeenCalled();
  });

  it("não mostra o formulário enquanto carrega", () => {
    setup({ isLoading: true });

    expect(screen.queryByText(/formulário de/)).not.toBeInTheDocument();
  });

  it("deixa tentar de novo quando o perfil não carrega", async () => {
    const { refetch } = setup({ isError: true });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(refetch).toHaveBeenCalled();
  });
});
