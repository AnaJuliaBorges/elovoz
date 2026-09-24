import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { toast } from "sonner";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../hooks/useNotifications";
import type { AppNotification } from "../model/notification";
import NotificationsPage from "./NotificationsPage";

vi.mock("../hooks/useNotifications");
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

type MutateOptions = { onError?: (error: unknown) => void };

const unread: AppNotification = {
  id: "n-1",
  need_id: "need-1",
  read: false,
  created_at: "2026-09-24T12:00:00Z",
  need: {
    id: "need-1",
    title: "Cestas básicas",
    urgency: "high",
    ong: { id: "ong-1", trade_name: "Casa Esperança" },
  },
};

const read: AppNotification = {
  ...unread,
  id: "n-2",
  need_id: "need-2",
  read: true,
  need: { ...unread.need!, id: "need-2", title: "Cobertores" },
};

function setup({
  data = [unread, read] as AppNotification[] | null,
  isLoading = false,
  isError = false,
} = {}) {
  const refetch = vi.fn();
  vi.mocked(useNotifications).mockReturnValue({
    data,
    isLoading,
    isError,
    refetch,
  } as never);

  const markRead = vi.fn();
  vi.mocked(useMarkNotificationRead).mockReturnValue({
    mutate: markRead,
  } as never);

  const markAll = vi.fn();
  vi.mocked(useMarkAllNotificationsRead).mockReturnValue({
    mutate: markAll,
    isPending: false,
  } as never);

  render(
    <MemoryRouter>
      <NotificationsPage />
    </MemoryRouter>,
  );

  return { markRead, markAll, refetch };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("NotificationsPage", () => {
  it("lista os avisos com link para a necessidade", () => {
    setup();

    const link = screen.getByRole("link", { name: /Cestas básicas/ });
    expect(link).toHaveAttribute("href", "/necessidades/need-1");
    expect(link).toHaveTextContent("Casa Esperança publicou uma necessidade");
    expect(screen.getAllByLabelText("Não lido")).toHaveLength(1);
    expect(screen.getAllByText("Urgência alta")).toHaveLength(2);
  });

  it("abrir um aviso não lido marca como lido", async () => {
    const { markRead } = setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole("link", { name: /Cestas básicas/ }));

    expect(markRead).toHaveBeenCalledWith("n-1");
  });

  it("abrir um aviso já lido não grava nada", async () => {
    const { markRead } = setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole("link", { name: /Cobertores/ }));

    expect(markRead).not.toHaveBeenCalled();
  });

  it("marca todos como lidos e avisa se falhar", async () => {
    const { markAll } = setup();
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: "Marcar todos como lidos" }),
    );

    expect(markAll).toHaveBeenCalled();

    const [, options] = markAll.mock.calls[0] as [unknown, MutateOptions];
    options.onError?.(new Error("RLS"));
    expect(toast.error).toHaveBeenCalled();
  });

  it("esconde o marcar todos quando já está tudo lido", () => {
    setup({ data: [read] });

    expect(
      screen.queryByRole("button", { name: "Marcar todos como lidos" }),
    ).not.toBeInTheDocument();
  });

  it("aviso de necessidade que saiu do ar não vira link", () => {
    setup({ data: [{ ...unread, need: null }] });

    expect(
      screen.getByText("Esta necessidade não está mais disponível."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("orienta quando não há avisos", () => {
    setup({ data: [] });

    expect(screen.getByText("Nenhum aviso por aqui")).toBeInTheDocument();
  });

  it("não mostra lista enquanto carrega", () => {
    setup({ data: null, isLoading: true });

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("deixa tentar de novo quando a busca falha", async () => {
    const { refetch } = setup({ data: null, isError: true });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(refetch).toHaveBeenCalled();
  });
});
