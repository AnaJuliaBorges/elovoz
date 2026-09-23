import {
  formatCityState,
  formatFullAddress,
  ongSocialLinks,
  phoneLink,
  whatsappLink,
} from "./ong";

const place = {
  address: "Rua das Flores, 10",
  neighborhood: "Centro",
  city: { name: "Rio de Janeiro" },
  state: { uf: "RJ" },
};

describe("formatCityState", () => {
  it("junta cidade e UF", () => {
    expect(formatCityState(place)).toBe("Rio de Janeiro - RJ");
  });

  it("devolve vazio sem cidade", () => {
    expect(formatCityState({ city: null, state: { uf: "RJ" } })).toBe("");
  });
});

describe("formatFullAddress", () => {
  it("monta endereço, bairro, cidade e UF", () => {
    expect(formatFullAddress(place)).toBe(
      "Rua das Flores, 10 — Centro, Rio de Janeiro - RJ",
    );
  });

  it("sem cidade, fica só o endereço e o bairro", () => {
    expect(formatFullAddress({ ...place, city: null, state: null })).toBe(
      "Rua das Flores, 10 — Centro",
    );
  });
});

describe("links de telefone", () => {
  it("monta o wa.me com DDI e só dígitos", () => {
    expect(whatsappLink("(21) 99999-1234")).toBe("https://wa.me/5521999991234");
  });

  it("monta o tel: com DDI", () => {
    expect(phoneLink("(21) 3333-1234")).toBe("tel:+552133331234");
  });
});

describe("ongSocialLinks", () => {
  it("transforma @usuário em link do Instagram", () => {
    expect(
      ongSocialLinks({
        instagram: "@casasolidaria",
        facebook: null,
        website: null,
      }),
    ).toEqual([
      {
        key: "instagram",
        label: "@casasolidaria",
        href: "https://instagram.com/casasolidaria",
      },
    ]);
  });

  it("aceita usuário sem arroba no Facebook", () => {
    expect(
      ongSocialLinks({
        instagram: null,
        facebook: "casasolidaria",
        website: null,
      }),
    ).toEqual([
      {
        key: "facebook",
        label: "casasolidaria",
        href: "https://facebook.com/casasolidaria",
      },
    ]);
  });

  it("mantém a URL quando a pessoa colou o endereço inteiro", () => {
    expect(
      ongSocialLinks({
        instagram: "https://instagram.com/casasolidaria",
        facebook: null,
        website: "https://casasolidaria.org.br/",
      }),
    ).toEqual([
      {
        key: "instagram",
        label: "instagram.com/casasolidaria",
        href: "https://instagram.com/casasolidaria",
      },
      {
        key: "website",
        label: "casasolidaria.org.br",
        href: "https://casasolidaria.org.br/",
      },
    ]);
  });

  it("completa o protocolo do site quando falta", () => {
    expect(
      ongSocialLinks({
        instagram: null,
        facebook: null,
        website: "casasolidaria.org.br",
      }),
    ).toEqual([
      {
        key: "website",
        label: "casasolidaria.org.br",
        href: "https://casasolidaria.org.br",
      },
    ]);
  });

  it("devolve lista vazia quando a ONG não informou nada", () => {
    expect(
      ongSocialLinks({ instagram: null, facebook: null, website: null }),
    ).toEqual([]);
  });
});
