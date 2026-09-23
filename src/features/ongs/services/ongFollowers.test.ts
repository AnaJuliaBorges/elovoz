import { supabase } from "@/lib/supabase";
import { createQueryBuilder } from "@/test/supabaseQueryBuilder";
import {
  fetchIsFollowingOng,
  followErrorMessage,
  followOng,
  unfollowOng,
} from "./ongFollowers";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
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

describe("fetchIsFollowingOng", () => {
  it("devolve true quando existe a linha do doador", async () => {
    withSession();
    const builder = createQueryBuilder({ data: { id: "follow-1" } });
    fromMock.mockReturnValue(builder as never);

    await expect(fetchIsFollowingOng("ong-1")).resolves.toBe(true);

    expect(fromMock).toHaveBeenCalledWith("ong_followers");
    expect(builder.eq).toHaveBeenCalledWith("ong_id", "ong-1");
    expect(builder.eq).toHaveBeenCalledWith("donor_id", "donor-1");
  });

  it("devolve false sem linha", async () => {
    withSession();
    fromMock.mockReturnValue(createQueryBuilder({ data: null }) as never);

    await expect(fetchIsFollowingOng("ong-1")).resolves.toBe(false);
  });

  it("devolve false sem sessão, sem consultar o banco", async () => {
    withoutSession();

    await expect(fetchIsFollowingOng("ong-1")).resolves.toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("propaga erro do supabase", async () => {
    withSession();
    fromMock.mockReturnValue(
      createQueryBuilder({ error: new Error("RLS") }) as never,
    );

    await expect(fetchIsFollowingOng("ong-1")).rejects.toThrow("RLS");
  });
});

describe("followOng", () => {
  it("grava o par doador/ONG", async () => {
    withSession();
    const builder = createQueryBuilder();
    fromMock.mockReturnValue(builder as never);

    await followOng("ong-1");

    expect(builder.insert).toHaveBeenCalledWith({
      ong_id: "ong-1",
      donor_id: "donor-1",
    });
  });

  it("ignora violação de unicidade: já seguia", async () => {
    withSession();
    fromMock.mockReturnValue(
      createQueryBuilder({ error: { code: "23505" } }) as never,
    );

    await expect(followOng("ong-1")).resolves.toBeUndefined();
  });

  it("propaga recusa da RLS", async () => {
    withSession();
    const error = { code: "42501", message: "recusado" };
    fromMock.mockReturnValue(createQueryBuilder({ error }) as never);

    await expect(followOng("ong-1")).rejects.toEqual(error);
  });

  it("explica quando não há sessão", async () => {
    withoutSession();

    await expect(followOng("ong-1")).rejects.toThrow(/Entre na sua conta/);
    expect(fromMock).not.toHaveBeenCalled();
  });
});

describe("unfollowOng", () => {
  it("apaga a linha do doador", async () => {
    withSession();
    const builder = createQueryBuilder();
    fromMock.mockReturnValue(builder as never);

    await unfollowOng("ong-1");

    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith("ong_id", "ong-1");
    expect(builder.eq).toHaveBeenCalledWith("donor_id", "donor-1");
  });

  it("não faz nada sem sessão", async () => {
    withoutSession();

    await expect(unfollowOng("ong-1")).resolves.toBeUndefined();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("propaga erro do supabase", async () => {
    withSession();
    fromMock.mockReturnValue(
      createQueryBuilder({ error: new Error("rede") }) as never,
    );

    await expect(unfollowOng("ong-1")).rejects.toThrow("rede");
  });
});

describe("followErrorMessage", () => {
  it("explica a recusa da RLS para quem não é doador", () => {
    expect(followErrorMessage({ code: "42501" })).toMatch(/conta de doador/);
  });

  it("cai na mensagem genérica nos outros casos", () => {
    expect(followErrorMessage(new Error("rede"))).toBe(
      "Não foi possível atualizar. Tente novamente.",
    );
  });
});
