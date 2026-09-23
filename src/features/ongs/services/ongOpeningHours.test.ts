import { supabase } from "@/lib/supabase";
import { createQueryBuilder } from "@/test/supabaseQueryBuilder";
import { fetchOngOpeningHours, saveOngOpeningHours } from "./ongOpeningHours";

vi.mock("@/lib/supabase", () => ({ supabase: { from: vi.fn() } }));

const fromMock = vi.mocked(supabase.from);

const hours = [
  { weekday: 1 as const, opens_at: "09:00", closes_at: "17:00" },
  { weekday: 2 as const, opens_at: "09:00", closes_at: "17:00" },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchOngOpeningHours", () => {
  it("busca os horários da ONG em ordem de dia", async () => {
    const builder = createQueryBuilder({ data: hours });
    fromMock.mockReturnValue(builder as never);

    await expect(fetchOngOpeningHours("ong-1")).resolves.toEqual(hours);

    expect(fromMock).toHaveBeenCalledWith("ong_opening_hours");
    expect(builder.eq).toHaveBeenCalledWith("ong_id", "ong-1");
    expect(builder.order).toHaveBeenCalledWith("weekday");
  });

  it("devolve lista vazia quando não há nada", async () => {
    fromMock.mockReturnValue(createQueryBuilder({ data: null }) as never);

    await expect(fetchOngOpeningHours("ong-1")).resolves.toEqual([]);
  });

  it("propaga erro do supabase", async () => {
    fromMock.mockReturnValue(
      createQueryBuilder({ error: new Error("RLS") }) as never,
    );

    await expect(fetchOngOpeningHours("ong-1")).rejects.toThrow("RLS");
  });
});

describe("saveOngOpeningHours", () => {
  it("apaga a semana e grava os dias abertos", async () => {
    const remove = createQueryBuilder();
    const insert = createQueryBuilder();
    fromMock
      .mockReturnValueOnce(remove as never)
      .mockReturnValueOnce(insert as never);

    await saveOngOpeningHours("ong-1", hours);

    expect(remove.delete).toHaveBeenCalled();
    expect(remove.eq).toHaveBeenCalledWith("ong_id", "ong-1");
    expect(insert.insert).toHaveBeenCalledWith([
      { ong_id: "ong-1", weekday: 1, opens_at: "09:00", closes_at: "17:00" },
      { ong_id: "ong-1", weekday: 2, opens_at: "09:00", closes_at: "17:00" },
    ]);
  });

  it("semana vazia só apaga, sem INSERT", async () => {
    const remove = createQueryBuilder();
    fromMock.mockReturnValue(remove as never);

    await saveOngOpeningHours("ong-1", []);

    expect(remove.delete).toHaveBeenCalled();
    expect(fromMock).toHaveBeenCalledTimes(1);
  });

  it("não grava quando o DELETE falha", async () => {
    fromMock.mockReturnValue(
      createQueryBuilder({ error: new Error("RLS") }) as never,
    );

    await expect(saveOngOpeningHours("ong-1", hours)).rejects.toThrow("RLS");
    expect(fromMock).toHaveBeenCalledTimes(1);
  });

  it("propaga erro do INSERT", async () => {
    fromMock
      .mockReturnValueOnce(createQueryBuilder() as never)
      .mockReturnValueOnce(
        createQueryBuilder({ error: new Error("RLS") }) as never,
      );

    await expect(saveOngOpeningHours("ong-1", hours)).rejects.toThrow("RLS");
  });
});
