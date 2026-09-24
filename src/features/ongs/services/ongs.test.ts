import { supabase } from "@/lib/supabase";
import { createQueryBuilder } from "@/test/supabaseQueryBuilder";
import {
  fetchMyOng,
  fetchOngProfile,
  fetchOngsForReview,
  setOngVerificationStatus,
} from "./ongs";

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

const ongProfile = {
  id: "ong-1",
  profile_id: "user-1",
  trade_name: "Casa Solidária",
  legal_name: "Associação Casa Solidária",
  cnpj: "12345678000195",
  mission: "Acolher famílias em situação de rua",
  neighborhood: "Centro",
  address: "Rua das Flores, 10",
  instagram: "@casasolidaria",
  facebook: null,
  website: null,
  verification_status: "approved",
  created_at: "2026-09-10T12:00:00Z",
  city: { name: "Rio de Janeiro" },
  state: { uf: "RJ" },
  contacts: [{ id: "contact-1", number: "21999991234", whatsapp: true }],
};

describe("fetchOngProfile", () => {
  it("busca a ONG com contatos e localização", async () => {
    const builder = createQueryBuilder({ data: ongProfile });
    fromMock.mockReturnValue(builder as never);

    await expect(fetchOngProfile("ong-1")).resolves.toEqual(ongProfile);

    expect(fromMock).toHaveBeenCalledWith("ongs");
    expect(builder.select).toHaveBeenCalledWith(
      expect.stringContaining("contacts:ong_contacts(id, number, whatsapp)"),
    );
    expect(builder.eq).toHaveBeenCalledWith("id", "ong-1");
    expect(builder.maybeSingle).toHaveBeenCalled();
  });

  it("devolve null quando a RLS esconde a ONG não aprovada", async () => {
    fromMock.mockReturnValue(createQueryBuilder({ data: null }) as never);

    await expect(fetchOngProfile("ong-1")).resolves.toBeNull();
  });

  it("trata id que não é uuid como não encontrada", async () => {
    fromMock.mockReturnValue(
      createQueryBuilder({ error: { code: "22P02" } }) as never,
    );

    await expect(fetchOngProfile("abc")).resolves.toBeNull();
  });

  it("propaga os outros erros", async () => {
    fromMock.mockReturnValue(
      createQueryBuilder({ error: new Error("rede") }) as never,
    );

    await expect(fetchOngProfile("ong-1")).rejects.toThrow("rede");
  });
});

describe("fetchOngsForReview", () => {
  it("lista as ONGs com o responsável, das mais antigas para as mais novas", async () => {
    const row = { ...ong, responsible: { name: "Ana", phone: null } };
    const builder = createQueryBuilder({ data: [row] });
    fromMock.mockReturnValue(builder as never);

    await expect(fetchOngsForReview()).resolves.toEqual([row]);

    expect(fromMock).toHaveBeenCalledWith("ongs");
    expect(builder.select).toHaveBeenCalledWith(
      expect.stringContaining("responsible:profiles(name, phone)"),
    );
    expect(builder.order).toHaveBeenCalledWith("created_at");
  });

  it("devolve lista vazia sem linhas", async () => {
    fromMock.mockReturnValue(createQueryBuilder({ data: null }) as never);

    await expect(fetchOngsForReview()).resolves.toEqual([]);
  });

  it("propaga erro do supabase", async () => {
    fromMock.mockReturnValue(
      createQueryBuilder({ error: new Error("RLS") }) as never,
    );

    await expect(fetchOngsForReview()).rejects.toThrow("RLS");
  });
});

describe("setOngVerificationStatus", () => {
  it("grava o novo status da ONG", async () => {
    const builder = createQueryBuilder({ data: { id: "ong-1" } });
    fromMock.mockReturnValue(builder as never);

    await setOngVerificationStatus("ong-1", "approved");

    expect(builder.update).toHaveBeenCalledWith({
      verification_status: "approved",
    });
    expect(builder.eq).toHaveBeenCalledWith("id", "ong-1");
    expect(builder.single).toHaveBeenCalled();
  });

  it("propaga o UPDATE barrado", async () => {
    fromMock.mockReturnValue(
      createQueryBuilder({ error: { code: "PGRST116" } }) as never,
    );

    await expect(
      setOngVerificationStatus("ong-1", "rejected"),
    ).rejects.toEqual({ code: "PGRST116" });
  });
});
