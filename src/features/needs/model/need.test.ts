import { formatOngLocation, isOpenForDonation } from "./need";

describe("formatOngLocation", () => {
  it("junta bairro, cidade e UF", () => {
    expect(
      formatOngLocation({
        id: "ong-1",
        trade_name: "Casa Solidária",
        neighborhood: "Centro",
        city: { name: "Rio de Janeiro" },
        state: { uf: "RJ" },
      }),
    ).toBe("Centro, Rio de Janeiro - RJ");
  });

  it("aceita cidade e estado ausentes", () => {
    expect(
      formatOngLocation({
        id: "ong-1",
        trade_name: "Casa Solidária",
        neighborhood: "Centro",
        city: null,
        state: null,
      }),
    ).toBe("Centro");
  });
});

describe("isOpenForDonation", () => {
  const today = "2026-09-22";

  it("aceita aberta sem prazo", () => {
    expect(isOpenForDonation({ status: "open", deadline: null }, today)).toBe(
      true,
    );
  });

  it("aceita parcialmente atendida com prazo hoje", () => {
    expect(
      isOpenForDonation(
        { status: "partially_fulfilled", deadline: today },
        today,
      ),
    ).toBe(true);
  });

  it("recusa prazo vencido", () => {
    expect(
      isOpenForDonation({ status: "open", deadline: "2026-09-21" }, today),
    ).toBe(false);
  });

  it("recusa atendida, mesmo dentro do prazo", () => {
    expect(
      isOpenForDonation({ status: "fulfilled", deadline: "2026-12-01" }, today),
    ).toBe(false);
  });

  it("usa a data de hoje quando não recebe uma", () => {
    expect(isOpenForDonation({ status: "open", deadline: null })).toBe(true);
  });
});
