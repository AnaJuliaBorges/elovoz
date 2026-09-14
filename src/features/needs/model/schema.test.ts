import type { Need } from "./need";
import { emptyNeedForm, needSchema, needToForm } from "./schema";

const valid = {
  ...emptyNeedForm,
  title: "Cestas básicas",
  category_id: "cat-1",
};

function errorsOf(values: Record<string, unknown>) {
  const result = needSchema.safeParse(values);

  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 8, 14, 10));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("needSchema", () => {
  it("aceita só título e categoria", () => {
    expect(needSchema.safeParse(valid).success).toBe(true);
  });

  it("exige título e categoria", () => {
    expect(errorsOf(emptyNeedForm)).toEqual([
      "Dê um título com pelo menos 3 caracteres",
      "Escolha a categoria",
    ]);
  });

  it("não conta espaços como título", () => {
    expect(errorsOf({ ...valid, title: "   " })).toEqual([
      "Dê um título com pelo menos 3 caracteres",
    ]);
  });

  it.each(["abc", "0", "2.5", "-3", "1000001"])(
    "recusa quantidade %s",
    (quantity) => {
      expect(errorsOf({ ...valid, quantity })).toEqual([
        "Informe um número inteiro maior que zero",
      ]);
    },
  );

  it("aceita quantidade inteira positiva", () => {
    expect(errorsOf({ ...valid, quantity: "30" })).toEqual([]);
  });

  it("recusa prazo no passado e aceita hoje", () => {
    expect(errorsOf({ ...valid, deadline: "2026-09-13" })).toEqual([
      "O prazo não pode estar no passado",
    ]);
    expect(errorsOf({ ...valid, deadline: "2026-09-14" })).toEqual([]);
  });

  it("limita a descrição a 1000 caracteres", () => {
    expect(errorsOf({ ...valid, description: "a".repeat(1001) })).toEqual([
      "Use no máximo 1000 caracteres",
    ]);
  });
});

describe("needToForm", () => {
  it("converte os campos nulos do banco em texto vazio", () => {
    const need: Need = {
      id: "need-1",
      ong_id: "ong-1",
      category_id: "cat-1",
      title: "Cestas básicas",
      description: null,
      quantity: null,
      urgency: "high",
      deadline: null,
      status: "open",
      created_at: "2026-09-10T12:00:00Z",
      updated_at: "2026-09-10T12:00:00Z",
    };

    expect(needToForm(need)).toEqual({
      title: "Cestas básicas",
      category_id: "cat-1",
      description: "",
      quantity: "",
      urgency: "high",
      deadline: "",
    });

    expect(
      needToForm({ ...need, quantity: 30, deadline: "2026-10-01" }),
    ).toMatchObject({ quantity: "30", deadline: "2026-10-01" });
  });
});
