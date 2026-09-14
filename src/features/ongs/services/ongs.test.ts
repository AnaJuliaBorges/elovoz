import { supabase } from "@/lib/supabase";
import { createQueryBuilder } from "@/test/supabaseQueryBuilder";
import { fetchMyOng } from "./ongs";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    auth: { getSession: vi.fn() },
  },
}));

const fromMock = vi.mocked(supabase.from);
const getSessionMock = vi.mocked(supabase.auth.getSession);

const ong = {
  id: "ong-1",
  trade_name: "Casa Solidária",
  verification_status: "approved",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchMyOng", () => {
  it("devolve null sem sessão, sem consultar o banco", async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } } as never);

    await expect(fetchMyOng()).resolves.toBeNull();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("busca a ONG do usuário logado", async () => {
    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
    } as never);
    const builder = createQueryBuilder({ data: ong });
    fromMock.mockReturnValue(builder as never);

    await expect(fetchMyOng()).resolves.toEqual(ong);

    expect(fromMock).toHaveBeenCalledWith("ongs");
    expect(builder.eq).toHaveBeenCalledWith("profile_id", "user-1");
    expect(builder.limit).toHaveBeenCalledWith(1);
    expect(builder.maybeSingle).toHaveBeenCalled();
  });

  it("devolve null quando o perfil não tem ONG", async () => {
    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
    } as never);
    fromMock.mockReturnValue(createQueryBuilder({ data: null }) as never);

    await expect(fetchMyOng()).resolves.toBeNull();
  });

  it("propaga erro do supabase", async () => {
    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
    } as never);
    fromMock.mockReturnValue(
      createQueryBuilder({ error: new Error("RLS") }) as never,
    );

    await expect(fetchMyOng()).rejects.toThrow("RLS");
  });
});
