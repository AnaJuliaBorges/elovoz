import { supabase } from "@/lib/supabase";
import { createQueryBuilder } from "@/test/supabaseQueryBuilder";
import {
  NOTIFICATIONS_LIMIT,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNewNotifications,
} from "./notifications";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
    auth: { getSession: vi.fn() },
  },
}));

const fromMock = vi.mocked(supabase.from);
const getSessionMock = vi.mocked(supabase.auth.getSession);

function withSession() {
  getSessionMock.mockResolvedValue({
    data: { session: { user: { id: "donor-1" } } },
  } as never);
}

function withoutSession() {
  getSessionMock.mockResolvedValue({ data: { session: null } } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchNotifications", () => {
  it("lista os avisos do doador, dos mais novos para os mais velhos", async () => {
    withSession();
    const row = { id: "n-1", need_id: "need-1", read: false, need: null };
    const builder = createQueryBuilder({ data: [row] });
    fromMock.mockReturnValue(builder as never);

    await expect(fetchNotifications()).resolves.toEqual([row]);

    expect(fromMock).toHaveBeenCalledWith("notifications");
    expect(builder.eq).toHaveBeenCalledWith("donor_id", "donor-1");
    expect(builder.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
    expect(builder.limit).toHaveBeenCalledWith(NOTIFICATIONS_LIMIT);
  });

  it("devolve lista vazia sem sessão, sem consultar o banco", async () => {
    withoutSession();

    await expect(fetchNotifications()).resolves.toEqual([]);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("propaga erro do supabase", async () => {
    withSession();
    fromMock.mockReturnValue(
      createQueryBuilder({ error: new Error("RLS") }) as never,
    );

    await expect(fetchNotifications()).rejects.toThrow("RLS");
  });
});

describe("markNotificationRead", () => {
  it("marca o aviso como lido", async () => {
    const builder = createQueryBuilder();
    fromMock.mockReturnValue(builder as never);

    await markNotificationRead("n-1");

    expect(builder.update).toHaveBeenCalledWith({ read: true });
    expect(builder.eq).toHaveBeenCalledWith("id", "n-1");
  });

  it("propaga erro do supabase", async () => {
    fromMock.mockReturnValue(
      createQueryBuilder({ error: new Error("RLS") }) as never,
    );

    await expect(markNotificationRead("n-1")).rejects.toThrow("RLS");
  });
});

describe("markAllNotificationsRead", () => {
  it("marca só os não lidos do doador logado", async () => {
    withSession();
    const builder = createQueryBuilder();
    fromMock.mockReturnValue(builder as never);

    await markAllNotificationsRead();

    expect(builder.update).toHaveBeenCalledWith({ read: true });
    expect(builder.eq).toHaveBeenCalledWith("donor_id", "donor-1");
    expect(builder.eq).toHaveBeenCalledWith("read", false);
  });

  it("não faz nada sem sessão", async () => {
    withoutSession();

    await markAllNotificationsRead();

    expect(fromMock).not.toHaveBeenCalled();
  });

  it("propaga erro do supabase", async () => {
    withSession();
    fromMock.mockReturnValue(
      createQueryBuilder({ error: new Error("RLS") }) as never,
    );

    await expect(markAllNotificationsRead()).rejects.toThrow("RLS");
  });
});

describe("subscribeToNewNotifications", () => {
  it("escuta INSERT dos avisos do doador e desliga ao sair", () => {
    let handler: (() => void) | undefined;
    const channel = {
      on: vi.fn((_event: string, _filter: unknown, callback: () => void) => {
        handler = callback;
        return channel;
      }),
      subscribe: vi.fn(() => channel),
    };
    vi.mocked(supabase.channel).mockReturnValue(channel as never);
    const onInsert = vi.fn();

    const unsubscribe = subscribeToNewNotifications("donor-1", onInsert);

    expect(supabase.channel).toHaveBeenCalledWith("notifications:donor-1");
    expect(channel.on).toHaveBeenCalledWith(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: "donor_id=eq.donor-1",
      },
      expect.any(Function),
    );
    expect(channel.subscribe).toHaveBeenCalled();

    handler?.();
    expect(onInsert).toHaveBeenCalled();

    unsubscribe();
    expect(supabase.removeChannel).toHaveBeenCalledWith(channel);
  });
});
