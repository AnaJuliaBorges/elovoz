import {
  emptyOpeningHoursForm,
  groupOpeningHours,
  openingHoursErrors,
  openingHoursToRows,
  toOpeningHoursForm,
  toTimeInput,
  type OpeningHour,
  type Weekday,
} from "./openingHours";

function hour(weekday: Weekday, opens = "09:00:00", closes = "17:00:00") {
  return { weekday, opens_at: opens, closes_at: closes };
}

describe("toTimeInput", () => {
  it("corta os segundos que a coluna `time` devolve", () => {
    expect(toTimeInput("09:00:00")).toBe("09:00");
  });
});

describe("toOpeningHoursForm", () => {
  it("devolve os sete dias, da segunda ao domingo", () => {
    const form = toOpeningHoursForm([]);

    expect(form.days.map((day) => day.weekday)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(form.days.every((day) => !day.open)).toBe(true);
  });

  it("marca os dias salvos e tira os segundos", () => {
    const form = toOpeningHoursForm([hour(1), hour(0, "10:00:00", "14:00:00")]);

    expect(form.days[0]).toEqual({
      weekday: 1,
      open: true,
      opens_at: "09:00",
      closes_at: "17:00",
    });
    expect(form.days[6]).toEqual({
      weekday: 0,
      open: true,
      opens_at: "10:00",
      closes_at: "14:00",
    });
    expect(form.days[1].open).toBe(false);
  });
});

describe("openingHoursToRows", () => {
  it("guarda só os dias marcados", () => {
    const form = toOpeningHoursForm([hour(1), hour(3)]);

    expect(openingHoursToRows(form)).toEqual([
      { weekday: 1, opens_at: "09:00", closes_at: "17:00" },
      { weekday: 3, opens_at: "09:00", closes_at: "17:00" },
    ]);
  });

  it("devolve lista vazia quando nada foi marcado", () => {
    expect(openingHoursToRows(emptyOpeningHoursForm)).toEqual([]);
  });
});

describe("openingHoursErrors", () => {
  it("não reclama de dia fechado sem horário", () => {
    expect(openingHoursErrors(emptyOpeningHoursForm)).toEqual({});
  });

  it("cobra o horário do dia marcado", () => {
    const form = {
      days: emptyOpeningHoursForm.days.map((day) =>
        day.weekday === 2 ? { ...day, open: true } : day,
      ),
    };

    expect(openingHoursErrors(form)[2]).toMatch(/abertura e de fechamento/);
  });

  it("recusa fechamento antes da abertura", () => {
    const form = {
      days: emptyOpeningHoursForm.days.map((day) =>
        day.weekday === 5
          ? { ...day, open: true, opens_at: "18:00", closes_at: "09:00" }
          : day,
      ),
    };

    expect(openingHoursErrors(form)[5]).toMatch(/depois da abertura/);
  });

  it("indexa o erro pelo dia da semana, não pela posição no array", () => {
    const form = {
      days: emptyOpeningHoursForm.days.map((day) =>
        day.weekday === 0
          ? { ...day, open: true, opens_at: "10:00", closes_at: "09:00" }
          : day,
      ),
    };

    // domingo é o último do formulário (índice 6), mas a chave é 0
    expect(Object.keys(openingHoursErrors(form))).toEqual(["0"]);
  });
});

describe("groupOpeningHours", () => {
  it("junta dias seguidos com o mesmo horário num intervalo", () => {
    expect(
      groupOpeningHours([hour(1), hour(2), hour(3), hour(4), hour(5)]),
    ).toEqual([{ days: "Seg a Sex", opens_at: "09:00", closes_at: "17:00" }]);
  });

  it("lista dias salteados com o mesmo horário", () => {
    expect(groupOpeningHours([hour(1), hour(3), hour(5)])).toEqual([
      { days: "Seg, Qua e Sex", opens_at: "09:00", closes_at: "17:00" },
    ]);
  });

  it("usa 'e' quando são só dois dias seguidos", () => {
    expect(groupOpeningHours([hour(1), hour(2)])).toEqual([
      { days: "Seg e Ter", opens_at: "09:00", closes_at: "17:00" },
    ]);
  });

  it("separa faixas de horário diferentes", () => {
    const groups = groupOpeningHours([
      hour(1),
      hour(2),
      hour(6, "08:00:00", "12:00:00"),
    ]);

    expect(groups).toEqual([
      { days: "Seg e Ter", opens_at: "09:00", closes_at: "17:00" },
      { days: "Sáb", opens_at: "08:00", closes_at: "12:00" },
    ]);
  });

  it("não encosta domingo na segunda: a semana começa na segunda", () => {
    expect(groupOpeningHours([hour(0), hour(1)])).toEqual([
      { days: "Seg e Dom", opens_at: "09:00", closes_at: "17:00" },
    ]);
  });

  it("ordena pela semana, mesmo recebendo fora de ordem", () => {
    const hours: OpeningHour[] = [hour(5), hour(1), hour(3)];

    expect(groupOpeningHours(hours)[0].days).toBe("Seg, Qua e Sex");
  });

  it("devolve lista vazia sem horários", () => {
    expect(groupOpeningHours([])).toEqual([]);
  });
});
