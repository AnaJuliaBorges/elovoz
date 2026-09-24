import {
  ongContactSchema,
  ongDataSchema,
  ongIdentitySchema,
  toOngForms,
} from "./ongForm";
import type { OngEditable } from "./ong";

describe("ongIdentitySchema", () => {
  it("aceita nome fantasia e missão, sem razão social nem CNPJ", () => {
    expect(
      ongIdentitySchema.safeParse({
        trade_name: "Casa Solidária",
        mission: "Distribuir alimentos para famílias em situação de rua.",
      }).success,
    ).toBe(true);
  });

  it("recusa nome fantasia vazio", () => {
    expect(
      ongIdentitySchema.safeParse({
        trade_name: " ",
        mission: "Distribuir alimentos para famílias em situação de rua.",
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

describe("toOngForms", () => {
  const ong: OngEditable = {
    id: "ong-1",
    trade_name: "Casa Solidária",
    legal_name: "Associação Casa Solidária",
    cnpj: "11222333000181",
    mission: "Distribuir alimentos para famílias em situação de rua.",
    state_id: "uf-rj",
    city_id: "rio",
    neighborhood: "Centro",
    address: "Rua das Flores, 100",
    instagram: null,
    facebook: "casasolidaria",
    website: null,
    contacts: [{ id: "c-1", number: "21998765432", whatsapp: true }],
  };

  it("converte o banco para os dois formulários", () => {
    expect(toOngForms(ong)).toEqual({
      identity: {
        trade_name: "Casa Solidária",
        mission: "Distribuir alimentos para famílias em situação de rua.",
      },
      contact: {
        state_id: "uf-rj",
        city_id: "rio",
        neighborhood: "Centro",
        address: "Rua das Flores, 100",
        contacts: [{ number: "(21) 99876-5432", whatsapp: true }],
        instagram: "",
        facebook: "casasolidaria",
        website: "",
      },
    });
  });

  it("abre com um telefone vazio quando não há nenhum salvo", () => {
    expect(toOngForms({ ...ong, contacts: [] }).contact.contacts).toEqual([
      { number: "", whatsapp: false },
    ]);
  });
});
