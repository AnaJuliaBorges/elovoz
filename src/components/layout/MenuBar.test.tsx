import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useLogout, useProfile, type UserType } from "@/features/auth";
import {
  useNotificationsRealtime,
  useUnreadNotificationsCount,
} from "@/features/notifications";
import MenuBar from "./MenuBar";

vi.mock("@/features/auth");
vi.mock("@/features/notifications");

function setup(userType: UserType | null, unread = 0, path = "/") {
  vi.mocked(useProfile).mockReturnValue({
    data: userType === null ? null : { id: "user-1", user_type: userType },
  } as never);
  vi.mocked(useLogout).mockReturnValue(vi.fn());
  vi.mocked(useUnreadNotificationsCount).mockReturnValue({
    data: unread,
  } as never);

  render(
    <MemoryRouter initialEntries={[path]}>
      <MenuBar />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MenuBar", () => {
  it("doador vê o contador de avisos e escuta o Realtime", () => {
    setup("donor", 3);

    // o menu é renderizado duas vezes: mobile e desktop
    expect(screen.getAllByText("3")).toHaveLength(2);
    expect(useUnreadNotificationsCount).toHaveBeenCalledWith({ enabled: true });
    expect(useNotificationsRealtime).toHaveBeenCalledWith("user-1");
  });

  it("limita o contador em 9+", () => {
    setup("donor", 12);

    expect(screen.getAllByText("9+")).toHaveLength(2);
  });

  it("sem avisos não mostra contador", () => {
    setup("donor", 0);

    expect(screen.queryByText(/não lidos/)).not.toBeInTheDocument();
  });

  it("ONG não consulta avisos nem escuta o Realtime", () => {
    setup("ong");

    expect(useUnreadNotificationsCount).toHaveBeenCalledWith({
      enabled: false,
    });
    expect(useNotificationsRealtime).toHaveBeenCalledWith(undefined);
    expect(screen.queryByText("Avisos")).not.toBeInTheDocument();
  });

  it("acende só o item de caminho mais específico", () => {
    setup("admin", 0, "/admin/usuarios");

    // o primeiro rótulo é o do menu mobile, onde a cor fica no próprio texto
    const [users] = screen.getAllByText("Usuários");
    const [ongs] = screen.getAllByText("ONGs");
    expect(users).toHaveClass("text-primary");
    expect(ongs).not.toHaveClass("text-primary");
  });

  it("visitante vê Buscar, Entrar e Criar conta, sem Sair", () => {
    setup(null);

    expect(screen.getAllByText("Buscar")).toHaveLength(2);
    expect(screen.getAllByText("Entrar")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Criar conta" })).toBeInTheDocument();
    expect(screen.queryByText("Sair")).not.toBeInTheDocument();
    expect(screen.queryByText("Avisos")).not.toBeInTheDocument();
    expect(useNotificationsRealtime).toHaveBeenCalledWith(undefined);
  });
});
