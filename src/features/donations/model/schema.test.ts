import { emptyInterestForm, interestSchema } from "./schema";

const base = { ...emptyInterestForm, message: "Tenho 10 cestas para doar" };

describe("interestSchema", () => {
  it("aceita só a mensagem", () => {
    expect(interestSchema.safeParse(base).success).toBe(true);
  });

  it("aceita enviar sem mensagem", () => {
    expect(interestSchema.safeParse(emptyInterestForm).success).toBe(true);
  });

  it("recusa mensagem longa demais", () => {
    const result = interestSchema.safeParse({
      ...base,
      message: "a".repeat(1001),
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/1000 caracteres/);
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
      expected_deadline: "01/01/2020",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/passado/);
  });

  it("recusa data que não existe ou fora do formato", () => {
    for (const expected_deadline of ["31/02/2030", "20/12", "2030-12-20"]) {
      const result = interestSchema.safeParse({ ...base, expected_deadline });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toMatch(/dd\/mm\/aaaa/);
    }
  });

  it("aceita data futura no formato brasileiro", () => {
    expect(
      interestSchema.safeParse({ ...base, expected_deadline: "20/12/2099" })
        .success,
    ).toBe(true);
  });
});
