import { formatDate, todayIso } from "./dates";

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
