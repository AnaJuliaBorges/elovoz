import { formatDate, parseBrDate, todayIso } from "./dates";

describe("todayIso", () => {
  it("usa a data local, com zero à esquerda", () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });
});

describe("formatDate", () => {
  it("converte AAAA-MM-DD para DD/MM/AAAA sem voltar um dia", () => {
    expect(formatDate("2026-09-01")).toBe("01/09/2026");
  });

  it("ignora a parte de hora de um timestamp", () => {
    expect(formatDate("2026-09-14T02:00:00Z")).toBe("14/09/2026");
  });
});

describe("parseBrDate", () => {
  it("converte DD/MM/AAAA para o formato da coluna date", () => {
    expect(parseBrDate("20/12/2026")).toBe("2026-12-20");
    expect(parseBrDate(" 05/01/2027 ")).toBe("2027-01-05");
  });

  it("recusa data que não existe", () => {
    expect(parseBrDate("31/02/2026")).toBeNull();
    expect(parseBrDate("00/05/2026")).toBeNull();
    expect(parseBrDate("10/13/2026")).toBeNull();
  });

  it("aceita 29/02 só em ano bissexto", () => {
    expect(parseBrDate("29/02/2028")).toBe("2028-02-29");
    expect(parseBrDate("29/02/2027")).toBeNull();
  });

  it("recusa formato incompleto ou diferente", () => {
    expect(parseBrDate("")).toBeNull();
    expect(parseBrDate("20/12")).toBeNull();
    expect(parseBrDate("2026-12-20")).toBeNull();
  });
});
