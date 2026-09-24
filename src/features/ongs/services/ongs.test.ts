import { supabase } from "@/lib/supabase";
import { createQueryBuilder } from "@/test/supabaseQueryBuilder";
import {
  fetchMyOng,
  fetchOngProfile,
  fetchOngForEdit,
  fetchOngsForReview,
  setOngVerificationStatus,
  updateOngContact,
  updateOngIdentity,
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

describe("fetchOngForEdit", () => {
  it("busca a ONG com os ids de localização e os contatos", async () => {
    const builder = createQueryBuilder({ data: { id: "ong-1" } });
    fromMock.mockReturnValue(builder as never);

    await expect(fetchOngForEdit("ong-1")).resolves.toEqual({ id: "ong-1" });

    expect(builder.select).toHaveBeenCalledWith(
      expect.stringContaining("state_id, city_id"),
    );
    expect(builder.eq).toHaveBeenCalledWith("id", "ong-1");
  });

  it("devolve null quando não acha", async () => {
    fromMock.mockReturnValue(createQueryBuilder({ data: null }) as never);

    await expect(fetchOngForEdit("ong-1")).resolves.toBeNull();
  });

  it("propaga erro do supabase", async () => {
    fromMock.mockReturnValue(
      createQueryBuilder({ error: new Error("RLS") }) as never,
    );

    await expect(fetchOngForEdit("ong-1")).rejects.toThrow("RLS");
  });
});

describe("updateOngIdentity", () => {
  it("grava só nome fantasia e missão", async () => {
    const builder = createQueryBuilder({ data: { id: "ong-1" } });
    fromMock.mockReturnValue(builder as never);

    await updateOngIdentity("ong-1", {
      trade_name: "Casa Nova",
      mission: "Distribuir alimentos para famílias em situação de rua.",
    });

    expect(builder.update).toHaveBeenCalledWith({
      trade_name: "Casa Nova",
      mission: "Distribuir alimentos para famílias em situação de rua.",
    });
    expect(builder.single).toHaveBeenCalled();
  });

  it("propaga o UPDATE barrado", async () => {
    fromMock.mockReturnValue(
      createQueryBuilder({ error: { code: "PGRST116" } }) as never,
    );

    await expect(
      updateOngIdentity("ong-1", { trade_name: "Casa", mission: "x" }),
    ).rejects.toEqual({ code: "PGRST116" });
  });
});

describe("updateOngContact", () => {
  const values = {
    state_id: "uf-rj",
    city_id: "rio",
    neighborhood: "Centro",
    address: "Rua das Flores, 10",
    contacts: [{ number: "(21) 99876-5432", whatsapp: true }],
    instagram: "@casa",
    facebook: "",
    website: "",
  };

  it("grava o endereço e substitui os telefones", async () => {
    const ongBuilder = createQueryBuilder({ data: { id: "ong-1" } });
    const deleteBuilder = createQueryBuilder();
    const insertBuilder = createQueryBuilder();
    fromMock
      .mockReturnValueOnce(ongBuilder as never)
      .mockReturnValueOnce(deleteBuilder as never)
      .mockReturnValueOnce(insertBuilder as never);

    await updateOngContact("ong-1", values);

    expect(ongBuilder.update).toHaveBeenCalledWith({
      state_id: "uf-rj",
      city_id: "rio",
      neighborhood: "Centro",
      address: "Rua das Flores, 10",
      instagram: "@casa",
      facebook: null,
      website: null,
    });
    expect(fromMock).toHaveBeenNthCalledWith(2, "ong_contacts");
    expect(deleteBuilder.eq).toHaveBeenCalledWith("ong_id", "ong-1");
    expect(insertBuilder.insert).toHaveBeenCalledWith([
      { ong_id: "ong-1", number: "21998765432", whatsapp: true },
    ]);
  });

  it("não mexe nos telefones quando o endereço falha", async () => {
    fromMock.mockReturnValueOnce(
      createQueryBuilder({ error: { code: "PGRST116" } }) as never,
    );

    await expect(updateOngContact("ong-1", values)).rejects.toEqual({
      code: "PGRST116",
    });
    expect(fromMock).toHaveBeenCalledTimes(1);
  });

  it("propaga erro ao apagar os telefones antigos", async () => {
    fromMock
      .mockReturnValueOnce(createQueryBuilder({ data: { id: "ong-1" } }) as never)
      .mockReturnValueOnce(
        createQueryBuilder({ error: new Error("delete") }) as never,
      );

    await expect(updateOngContact("ong-1", values)).rejects.toThrow("delete");
  });

  it("propaga erro ao gravar os telefones novos", async () => {
    fromMock
      .mockReturnValueOnce(createQueryBuilder({ data: { id: "ong-1" } }) as never)
      .mockReturnValueOnce(createQueryBuilder() as never)
      .mockReturnValueOnce(
        createQueryBuilder({ error: new Error("insert") }) as never,
      );

    await expect(updateOngContact("ong-1", values)).rejects.toThrow("insert");
  });
});
