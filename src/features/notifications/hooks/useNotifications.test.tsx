import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { toast } from "sonner";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNewNotifications,
} from "../services/notifications";
import type { AppNotification } from "../model/notification";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useNotificationsRealtime,
  useUnreadNotificationsCount,
} from "./useNotifications";

vi.mock("../services/notifications");
vi.mock("sonner", () => ({ toast: vi.fn() }));

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

function notificationWith(id: string, read: boolean): AppNotification {
  return { id, read } as AppNotification;
}

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
});

describe("useNotifications", () => {
  it("lista os avisos", async () => {
    vi.mocked(fetchNotifications).mockResolvedValue([]);
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual([]));
  });
});

describe("useUnreadNotificationsCount", () => {
  it("conta só os não lidos", async () => {
    vi.mocked(fetchNotifications).mockResolvedValue([
      notificationWith("a", false),
      notificationWith("b", true),
      notificationWith("c", false),
    ]);
    const { result } = renderHook(() => useUnreadNotificationsCount(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toBe(2));
  });

  it("não consulta quando desligado", () => {
    renderHook(() => useUnreadNotificationsCount({ enabled: false }), {
      wrapper,
    });

    expect(fetchNotifications).not.toHaveBeenCalled();
  });
});

describe("useMarkNotificationRead", () => {
  it("marca como lido e recarrega os avisos", async () => {
    vi.mocked(markNotificationRead).mockResolvedValue();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useMarkNotificationRead(), {
      wrapper,
    });

    await result.current.mutateAsync("n-1");

    expect(markNotificationRead).toHaveBeenCalledWith("n-1", expect.anything());
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["notifications"] });
  });
});

describe("useMarkAllNotificationsRead", () => {
  it("marca todos e recarrega os avisos", async () => {
    vi.mocked(markAllNotificationsRead).mockResolvedValue();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useMarkAllNotificationsRead(), {
      wrapper,
    });

    await result.current.mutateAsync();

    expect(markAllNotificationsRead).toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["notifications"] });
  });
});

describe("useNotificationsRealtime", () => {
  it("escuta os avisos do doador e desliga ao desmontar", () => {
    const unsubscribe = vi.fn();
    vi.mocked(subscribeToNewNotifications).mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useNotificationsRealtime("donor-1"), {
      wrapper,
    });

    expect(subscribeToNewNotifications).toHaveBeenCalledWith(
      "donor-1",
      expect.any(Function),
    );

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it("aviso novo recarrega a lista e mostra um toast", () => {
    vi.mocked(subscribeToNewNotifications).mockReturnValue(vi.fn());
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    renderHook(() => useNotificationsRealtime("donor-1"), { wrapper });

    const [, onInsert] = vi.mocked(subscribeToNewNotifications).mock
      .calls[0];
    onInsert();

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["notifications"] });
    expect(toast).toHaveBeenCalledWith(
      "Nova necessidade de uma instituição que você segue",
      expect.objectContaining({
        action: expect.objectContaining({ label: "Ver" }),
      }),
    );
  });

  it("não escuta nada sem doador", () => {
    renderHook(() => useNotificationsRealtime(undefined), { wrapper });

    expect(subscribeToNewNotifications).not.toHaveBeenCalled();
  });
});
