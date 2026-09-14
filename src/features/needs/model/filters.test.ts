import { filtersFromParams, filtersToParams } from "./filters";

describe("filtersFromParams", () => {
  it("lê os filtros da query string", () => {
    const params = new URLSearchParams(
      "categoria=cat-1&urgencia=high&estado=uuid-rj&cidade=uuid-rio&bairro=%20Centro%20",
    );

    expect(filtersFromParams(params)).toEqual({
      categoryId: "cat-1",
      urgency: "high",
      stateId: "uuid-rj",
      cityId: "uuid-rio",
      neighborhood: "Centro",
    });
  });

  it("ignora urgência desconhecida e parâmetros vazios", () => {
    expect(
      filtersFromParams(new URLSearchParams("urgencia=urgentissima&bairro=")),
    ).toEqual({
      categoryId: undefined,
      urgency: undefined,
      stateId: undefined,
      cityId: undefined,
      neighborhood: undefined,
    });
  });
});

describe("filtersToParams", () => {
  it("grava só os filtros preenchidos, com nomes em português", () => {
    expect(
      filtersToParams({ urgency: "low", cityId: "uuid-rio" }).toString(),
    ).toBe("urgencia=low&cidade=uuid-rio");
  });

  it("faz ida e volta sem perder nada", () => {
    const filters = {
      categoryId: "cat-1",
      urgency: "medium" as const,
      stateId: "uuid-rj",
      cityId: "uuid-rio",
      neighborhood: "Tijuca",
    };

    expect(filtersFromParams(filtersToParams(filters))).toEqual(filters);
  });
});
