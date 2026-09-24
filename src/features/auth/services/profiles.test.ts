import { supabase } from "@/lib/supabase";
import { createQueryBuilder } from "@/test/supabaseQueryBuilder";
import {
  createProfile,
  fetchCurrentProfile,
  fetchProfile,
  updateProfile,
} from "./profiles";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    auth: { getSession: vi.fn() },
  },
}));

const fromMock = vi.mocked(supabase.from);
const getSessionMock = vi.mocked(supabase.auth.getSession);

const profile = {
  id: "user-1",
  user_type: "donor",
  name: "Ana",
  phone: "21998765432",
  created_at: "2026-09-10T12:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchProfile", () => {
  it("busca o perfil pelo id", async () => {
    const builder = createQueryBuilder({ data: profile });
    fromMock.mockReturnValue(builder as never);

    await expect(fetchProfile("user-1")).resolves.toEqual(profile);

    expect(fromMock).toHaveBeenCalledWith("profiles");
    expect(builder.eq).toHaveBeenCalledWith("id", "user-1");
    expect(builder.maybeSingle).toHaveBeenCalled();
  });

  it("devolve null quando o perfil ainda não existe", async () => {
    fromMock.mockReturnValue(createQueryBuilder({ data: null }) as never);

    await expect(fetchProfile("user-1")).resolves.toBeNull();
  });

  it("propaga erro do supabase", async () => {
    fromMock.mockReturnValue(
      createQueryBuilder({ error: new Error("RLS") }) as never,
    );

    await expect(fetchProfile("user-1")).rejects.toThrow("RLS");
  });
});

describe("createProfile", () => {
  it("grava o perfil com o telefone só em dígitos", async () => {
    const builder = createQueryBuilder();
    fromMock.mockReturnValue(builder as never);

    await createProfile({
      id: "user-1",
      name: "Ana",
      phone: "(21) 99876-5432",
      user_type: "ong",
    });

    expect(builder.insert).toHaveBeenCalledWith({
      id: "user-1",
      name: "Ana",
      phone: "21998765432",
      user_type: "ong",
    });
  });

  it("grava telefone nulo quando não informado", async () => {
    const builder = createQueryBuilder();
    fromMock.mockReturnValue(builder as never);

    await createProfile({ id: "user-1", name: "Ana", user_type: "donor" });

    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ phone: null }),
    );
  });

  it("propaga erro do insert", async () => {
    fromMock.mockReturnValue(
      createQueryBuilder({ error: new Error("duplicate key") }) as never,
    );

    await expect(
      createProfile({ id: "user-1", name: "Ana", user_type: "donor" }),
    ).rejects.toThrow("duplicate key");
  });
});

describe("fetchCurrentProfile", () => {
  it("devolve null quando não há sessão", async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } } as never);

    await expect(fetchCurrentProfile()).resolves.toBeNull();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("busca o perfil do usuário da sessão", async () => {
    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
    } as never);
    const builder = createQueryBuilder({ data: profile });
    fromMock.mockReturnValue(builder as never);

    await expect(fetchCurrentProfile()).resolves.toEqual(profile);
    expect(builder.eq).toHaveBeenCalledWith("id", "user-1");
  });
});

describe("updateProfile", () => {
  it("grava nome aparado e telefone só em dígitos", async () => {
    const builder = createQueryBuilder({ data: { id: "user-1" } });
    fromMock.mockReturnValue(builder as never);

    await updateProfile("user-1", {
      name: "  Ana Souza ",
      phone: "(21) 99876-5432",
    });

    expect(fromMock).toHaveBeenCalledWith("profiles");
    expect(builder.update).toHaveBeenCalledWith({
      name: "Ana Souza",
      phone: "21998765432",
    });
    expect(builder.eq).toHaveBeenCalledWith("id", "user-1");
    expect(builder.single).toHaveBeenCalled();
  });

  it("manda null quando o telefone fica em branco", async () => {
    const builder = createQueryBuilder({ data: { id: "user-1" } });
    fromMock.mockReturnValue(builder as never);

    await updateProfile("user-1", { name: "Ana", phone: "" });

    expect(builder.update).toHaveBeenCalledWith({ name: "Ana", phone: null });
  });

  it("propaga o UPDATE barrado pela RLS", async () => {
    fromMock.mockReturnValue(
      createQueryBuilder({ error: { code: "PGRST116" } }) as never,
    );

    await expect(
      updateProfile("user-1", { name: "Ana" }),
    ).rejects.toEqual({ code: "PGRST116" });
  });
});
