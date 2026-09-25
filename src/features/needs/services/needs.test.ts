import { supabase } from "@/lib/supabase";
import { createQueryBuilder } from "@/test/supabaseQueryBuilder";
import { emptyNeedForm } from "../model/schema";
import {
  NEEDS_PAGE_SIZE,
  createNeed,
  deleteNeed,
  fetchNeed,
  fetchOngDashboardNeeds,
  fetchOngNeeds,
  needErrorMessage,
  searchNeeds,
  updateNeed,
  updateNeedStatus,
} from "./needs";

vi.mock("@/lib/supabase", () => ({ supabase: { from: vi.fn() } }));

vi.mock("@/lib/dates", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/dates")>()),
  todayIso: () => "2026-09-14",
}));

const fromMock = vi.mocked(supabase.from);

function mockBuilder(result: Parameters<typeof createQueryBuilder>[0] = {}) {
  const builder = createQueryBuilder(result);
  fromMock.mockReturnValue(builder as never);
  return builder;
}

const formValues = {
  ...emptyNeedForm,
  title: "Cestas básicas",
  category_id: "cat-1",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("needErrorMessage", () => {
  it("explica a recusa da RLS para ONG não aprovada", () => {
    expect(needErrorMessage({ code: "42501" })).toBe(
      "Sua ONG precisa estar aprovada para publicar necessidades.",
    );
  });

  it("explica o UPDATE/DELETE que não afetou nenhuma linha", () => {
    expect(needErrorMessage({ code: "PGRST116" })).toMatch(
      /não tem permissão/,
    );
  });

  it("usa a mensagem padrão ou a informada nos outros casos", () => {
    expect(needErrorMessage(new Error("timeout"))).toBe(
      "Não foi possível salvar a necessidade. Tente novamente.",
    );
    expect(needErrorMessage(null, "Falhou")).toBe("Falhou");
  });
});

describe("searchNeeds", () => {
  it("busca a primeira página do que ainda dá para atender", async () => {
    const builder = mockBuilder({ data: [{ id: "need-1" }], count: 1 });

    await expect(searchNeeds({})).resolves.toEqual({
      needs: [{ id: "need-1" }],
      total: 1,
    });

    expect(fromMock).toHaveBeenCalledWith("needs");
    expect(builder.select).toHaveBeenCalledWith(
      expect.stringContaining("ong:ongs!inner("),
      { count: "exact" },
    );
    expect(builder.in).toHaveBeenCalledWith("status", [
      "open",
      "partially_fulfilled",
    ]);
    expect(builder.or).toHaveBeenCalledWith(
      "deadline.is.null,deadline.gte.2026-09-14",
    );
    expect(builder.order).toHaveBeenNthCalledWith(1, "urgency", {
      ascending: false,
    });
    expect(builder.order).toHaveBeenNthCalledWith(2, "created_at", {
      ascending: false,
    });
    expect(builder.range).toHaveBeenCalledWith(0, NEEDS_PAGE_SIZE - 1);
    expect(builder.eq).not.toHaveBeenCalled();
    expect(builder.ilike).not.toHaveBeenCalled();
  });

  it("aplica categoria, urgência e localização da ONG", async () => {
    const builder = mockBuilder({ data: [], count: 0 });

    await searchNeeds({
      categoryId: "cat-1",
      urgency: "high",
      stateId: "uuid-rj",
      cityId: "uuid-rio",
      neighborhood: "Centro",
    });

    expect(builder.eq).toHaveBeenCalledWith("category_id", "cat-1");
    expect(builder.eq).toHaveBeenCalledWith("urgency", "high");
    expect(builder.eq).toHaveBeenCalledWith("ong.state_id", "uuid-rj");
    expect(builder.eq).toHaveBeenCalledWith("ong.city_id", "uuid-rio");
    expect(builder.ilike).toHaveBeenCalledWith("ong.neighborhood", "%Centro%");
  });

  it("trata % e _ do bairro como texto, não curinga", async () => {
    const builder = mockBuilder({ data: [] });

    await searchNeeds({ neighborhood: "50%_off" });

    expect(builder.ilike).toHaveBeenCalledWith(
      "ong.neighborhood",
      "%50\\%\\_off%",
    );
  });

  it("pagina de 12 em 12 e trata contagem ausente como zero", async () => {
    const builder = mockBuilder({ data: null, count: null });

    await expect(searchNeeds({}, 2)).resolves.toEqual({ needs: [], total: 0 });

    expect(builder.range).toHaveBeenCalledWith(24, 35);
  });

  it("propaga erro do supabase", async () => {
    mockBuilder({ error: new Error("sem conexão") });

    await expect(searchNeeds({})).rejects.toThrow("sem conexão");
  });
});

describe("fetchNeed", () => {
  it("busca a necessidade com categoria e ONG", async () => {
    const builder = mockBuilder({ data: { id: "need-1" } });

    await expect(fetchNeed("need-1")).resolves.toEqual({ id: "need-1" });

    expect(builder.eq).toHaveBeenCalledWith("id", "need-1");
    expect(builder.maybeSingle).toHaveBeenCalled();
  });

  it("devolve null quando não existe", async () => {
    mockBuilder({ data: null });

    await expect(fetchNeed("need-1")).resolves.toBeNull();
  });

  it("devolve null para id que não é uuid", async () => {
    mockBuilder({ error: { code: "22P02", message: "invalid input syntax" } });

    await expect(fetchNeed("abc")).resolves.toBeNull();
  });

  it("propaga os outros erros", async () => {
    mockBuilder({ error: new Error("RLS") });

    await expect(fetchNeed("need-1")).rejects.toThrow("RLS");
  });
});

describe("fetchOngDashboardNeeds", () => {
  it("conta os interesses de cada necessidade e quantos já foram respondidos", async () => {
    const builder = mockBuilder({
      data: [
        {
          id: "need-1",
          interests: [
            { answered_at: "2026-09-24T12:00:00Z" },
            { answered_at: null },
            { answered_at: null },
          ],
        },
        { id: "need-2", interests: [] },
      ],
    });

    await expect(fetchOngDashboardNeeds("ong-1")).resolves.toEqual([
      { id: "need-1", interest_count: 3, answered_count: 1 },
      { id: "need-2", interest_count: 0, answered_count: 0 },
    ]);

    expect(builder.select).toHaveBeenCalledWith(
      expect.stringContaining("interests(answered_at)"),
    );
    expect(builder.eq).toHaveBeenCalledWith("ong_id", "ong-1");
  });

  it("conta zero quando a resposta vem sem o embed", async () => {
    mockBuilder({ data: [{ id: "need-1" }] });

    await expect(fetchOngDashboardNeeds("ong-1")).resolves.toEqual([
      { id: "need-1", interest_count: 0, answered_count: 0 },
    ]);
  });

  it("propaga erro do supabase", async () => {
    mockBuilder({ error: new Error("RLS") });

    await expect(fetchOngDashboardNeeds("ong-1")).rejects.toThrow("RLS");
  });
});

describe("fetchOngNeeds", () => {
  it("lista as necessidades da ONG, das mais novas para as mais antigas", async () => {
    const builder = mockBuilder({ data: [{ id: "need-1" }] });

    await expect(fetchOngNeeds("ong-1")).resolves.toEqual([{ id: "need-1" }]);

    expect(builder.select).toHaveBeenCalledWith(
      expect.stringContaining("category:categories(id, name)"),
    );
    expect(builder.eq).toHaveBeenCalledWith("ong_id", "ong-1");
    expect(builder.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
  });

  it("devolve lista vazia sem dados e propaga erro", async () => {
    mockBuilder({ data: null });
    await expect(fetchOngNeeds("ong-1")).resolves.toEqual([]);

    mockBuilder({ error: new Error("RLS") });
    await expect(fetchOngNeeds("ong-1")).rejects.toThrow("RLS");
  });
});

describe("createNeed", () => {
  it("grava com campos opcionais vazios como null e devolve o id", async () => {
    const builder = mockBuilder({ data: { id: "need-1" } });

    await expect(createNeed("ong-1", formValues)).resolves.toBe("need-1");

    expect(builder.insert).toHaveBeenCalledWith({
      ong_id: "ong-1",
      title: "Cestas básicas",
      category_id: "cat-1",
      description: null,
      quantity: null,
      urgency: "medium",
      deadline: null,
    });
    expect(builder.select).toHaveBeenCalledWith("id");
    expect(builder.single).toHaveBeenCalled();
  });

  it("converte a quantidade para número", async () => {
    const builder = mockBuilder({ data: { id: "need-1" } });

    await createNeed("ong-1", {
      ...formValues,
      quantity: "30",
      description: "Para 30 famílias",
      deadline: "2026-10-01",
    });

    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        quantity: 30,
        description: "Para 30 famílias",
        deadline: "2026-10-01",
      }),
    );
  });

  it("propaga a recusa da RLS", async () => {
    mockBuilder({ error: { code: "42501" } });

    await expect(createNeed("ong-1", formValues)).rejects.toEqual({
      code: "42501",
    });
  });
});

describe("updateNeed", () => {
  it("atualiza pelo id e exige uma linha afetada", async () => {
    const builder = mockBuilder({ data: { id: "need-1" } });

    await updateNeed("need-1", { ...formValues, urgency: "low" });

    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Cestas básicas", urgency: "low" }),
    );
    expect(builder.update).toHaveBeenCalledWith(
      expect.not.objectContaining({ ong_id: expect.anything() }),
    );
    expect(builder.eq).toHaveBeenCalledWith("id", "need-1");
    expect(builder.single).toHaveBeenCalled();
  });

  it("propaga erro quando a RLS filtrou a linha", async () => {
    mockBuilder({ error: { code: "PGRST116" } });

    await expect(updateNeed("need-1", formValues)).rejects.toEqual({
      code: "PGRST116",
    });
  });
});

describe("updateNeedStatus", () => {
  it("muda só o status", async () => {
    const builder = mockBuilder({ data: { id: "need-1" } });

    await updateNeedStatus("need-1", "fulfilled");

    expect(builder.update).toHaveBeenCalledWith({ status: "fulfilled" });
    expect(builder.eq).toHaveBeenCalledWith("id", "need-1");
  });

  it("propaga erro", async () => {
    mockBuilder({ error: new Error("RLS") });

    await expect(updateNeedStatus("need-1", "open")).rejects.toThrow("RLS");
  });
});

describe("deleteNeed", () => {
  it("apaga pelo id e exige uma linha afetada", async () => {
    const builder = mockBuilder({ data: { id: "need-1" } });

    await deleteNeed("need-1");

    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith("id", "need-1");
    expect(builder.single).toHaveBeenCalled();
  });

  it("propaga erro", async () => {
    mockBuilder({ error: { code: "PGRST116" } });

    await expect(deleteNeed("need-1")).rejects.toEqual({ code: "PGRST116" });
  });
});
