import {
  accountSchema,
  loginSchema,
  ongContactSchema,
  ongDataSchema,
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

describe("ongDataSchema", () => {
  const validOng = {
    trade_name: "Casa Solidária",
    legal_name: "Associação Casa Solidária",
    cnpj: "11.222.333/0001-81",
    mission: "Distribuir alimentos para famílias em situação de rua.",
  };

  it("aceita dados institucionais completos", () => {
    expect(ongDataSchema.safeParse(validOng).success).toBe(true);
  });

  it("recusa CNPJ com dígito verificador errado", () => {
    const result = ongDataSchema.safeParse({
      ...validOng,
      cnpj: "11.222.333/0001-82",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("CNPJ inválido");
  });

  it("recusa missão curta demais", () => {
    expect(
      ongDataSchema.safeParse({ ...validOng, mission: "Ajudar" }).success,
    ).toBe(false);
  });
});

describe("ongContactSchema", () => {
  const validContact = {
    state_id: "uuid-rj",
    city_id: "uuid-rio",
    neighborhood: "Centro",
    address: "Rua das Flores, 100",
    contacts: [{ number: "(21) 99876-5432", whatsapp: true }],
    instagram: "",
    facebook: "",
    website: "",
  };

  it("aceita contato completo", () => {
    expect(ongContactSchema.safeParse(validContact).success).toBe(true);
  });

  it("exige estado e cidade", () => {
    expect(
      ongContactSchema.safeParse({ ...validContact, city_id: "" }).success,
    ).toBe(false);
  });

  it("exige pelo menos um telefone", () => {
    expect(
      ongContactSchema.safeParse({ ...validContact, contacts: [] }).success,
    ).toBe(false);
  });

  it("recusa telefone inválido na lista", () => {
    expect(
      ongContactSchema.safeParse({
        ...validContact,
        contacts: [{ number: "123", whatsapp: false }],
      }).success,
    ).toBe(false);
  });

  it("aceita site vazio, mas recusa URL malformada", () => {
    expect(ongContactSchema.safeParse(validContact).success).toBe(true);
    expect(
      ongContactSchema.safeParse({ ...validContact, website: "casa solidária" })
        .success,
    ).toBe(false);
    expect(
      ongContactSchema.safeParse({
        ...validContact,
        website: "https://casasolidaria.org",
      }).success,
    ).toBe(true);
  });
});
