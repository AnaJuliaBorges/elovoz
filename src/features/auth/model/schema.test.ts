import {
  accountSchema,
  loginSchema,
  resetPasswordSchema,
} from "./schema";

const validAccount = {
  user_type: "donor" as const,
  name: "Ana Borges",
  email: "ana@exemplo.com",
  password: "senha-forte-1",
  passwordConfirmation: "senha-forte-1",
  phone: "(21) 99876-5432",
};

describe("loginSchema", () => {
  it("exige e-mail válido e senha preenchida", () => {
    expect(loginSchema.safeParse({ email: "ana@exemplo.com", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "ana", password: "x" }).success).toBe(false);
    expect(
      loginSchema.safeParse({ email: "ana@exemplo.com", password: "" }).success,
    ).toBe(false);
  });
});

describe("accountSchema", () => {
  it("aceita um cadastro completo", () => {
    expect(accountSchema.safeParse(validAccount).success).toBe(true);
  });

  it("aceita telefone vazio (campo opcional)", () => {
    expect(
      accountSchema.safeParse({ ...validAccount, phone: "" }).success,
    ).toBe(true);
  });

  it("recusa telefone incompleto", () => {
    const result = accountSchema.safeParse({ ...validAccount, phone: "9987" });

    expect(result.success).toBe(false);
  });

  it("recusa senha curta", () => {
    const result = accountSchema.safeParse({
      ...validAccount,
      password: "1234",
      passwordConfirmation: "1234",
    });

    expect(result.success).toBe(false);
  });

  it("aponta a divergência no campo de confirmação", () => {
    const result = accountSchema.safeParse({
      ...validAccount,
      passwordConfirmation: "outra-senha",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["passwordConfirmation"]);
  });
});

describe("resetPasswordSchema", () => {
  it("exige senhas iguais", () => {
    expect(
      resetPasswordSchema.safeParse({
        password: "senha-nova-1",
        passwordConfirmation: "senha-nova-1",
      }).success,
    ).toBe(true);

    expect(
      resetPasswordSchema.safeParse({
        password: "senha-nova-1",
        passwordConfirmation: "diferente",
      }).success,
    ).toBe(false);
  });
});
