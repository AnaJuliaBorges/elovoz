import { emptyInterestForm, interestSchema } from "./schema";

const base = { ...emptyInterestForm, message: "Tenho 10 cestas para doar" };

describe("interestSchema", () => {
  it("aceita só a mensagem", () => {
    expect(interestSchema.safeParse(base).success).toBe(true);
  });

  it("exige uma mensagem com conteúdo", () => {
    const result = interestSchema.safeParse({ ...base, message: "oi" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/10 caracteres/);
  });

  it("recusa quantidade que não é inteiro positivo", () => {
    for (const expected_quantity of ["0", "-3", "2,5", "abc"]) {
      expect(
        interestSchema.safeParse({ ...base, expected_quantity }).success,
      ).toBe(false);
    }
  });

  it("aceita quantidade inteira", () => {
    expect(
      interestSchema.safeParse({ ...base, expected_quantity: "10" }).success,
    ).toBe(true);
  });

  it("recusa data no passado", () => {
    const result = interestSchema.safeParse({
      ...base,
      expected_deadline: "2020-01-01",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/passado/);
  });
});
