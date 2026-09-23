import { z } from "zod";

/** 0 = domingo, igual ao `extract(dow)` do Postgres. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface OpeningHour {
  weekday: Weekday;
  opens_at: string;
  closes_at: string;
}

/** Semana começando na segunda, como se lê em português. */
export const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};

export const WEEKDAY_SHORT_LABELS: Record<Weekday, string> = {
  0: "Dom",
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
};

/** A coluna `time` volta como "09:00:00"; o input type=time quer "09:00". */
export function toTimeInput(value: string): string {
  return value.slice(0, 5);
}

const daySchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    open: z.boolean(),
    opens_at: z.string(),
    closes_at: z.string(),
  })
  .refine((day) => !day.open || (!!day.opens_at && !!day.closes_at), {
    message: "Informe o horário de abertura e de fechamento",
    path: ["opens_at"],
  })
  .refine((day) => !day.open || day.closes_at > day.opens_at, {
    message: "O fechamento tem que ser depois da abertura",
    path: ["closes_at"],
  });

export const openingHoursSchema = z.object({
  days: z.array(daySchema).length(7),
});

export type OpeningHoursFormInput = z.infer<typeof openingHoursSchema>;
export type OpeningHoursDay = OpeningHoursFormInput["days"][number];

export const emptyOpeningHoursForm: OpeningHoursFormInput = {
  days: WEEKDAYS.map((weekday) => ({
    weekday,
    open: false,
    opens_at: "",
    closes_at: "",
  })),
};

/** Linhas do banco → formulário, sempre com os sete dias na ordem da semana. */
export function toOpeningHoursForm(
  hours: OpeningHour[],
): OpeningHoursFormInput {
  return {
    days: WEEKDAYS.map((weekday) => {
      const saved = hours.find((hour) => hour.weekday === weekday);

      return {
        weekday,
        open: !!saved,
        opens_at: saved ? toTimeInput(saved.opens_at) : "",
        closes_at: saved ? toTimeInput(saved.closes_at) : "",
      };
    }),
  };
}

/** Formulário → linhas do banco: só os dias marcados como abertos. */
export function openingHoursToRows(form: OpeningHoursFormInput): OpeningHour[] {
  return form.days
    .filter((day) => day.open)
    .map((day) => ({
      weekday: day.weekday as Weekday,
      opens_at: day.opens_at,
      closes_at: day.closes_at,
    }));
}

/**
 * Erros do schema por dia da semana, do jeito que os campos consomem: a chave
 * é o `weekday`, não o índice do array.
 */
export function openingHoursErrors(
  form: OpeningHoursFormInput,
): Record<number, string> {
  const result = openingHoursSchema.safeParse(form);

  if (result.success) return {};

  const errors: Record<number, string> = {};

  for (const issue of result.error.issues) {
    const index = Number(issue.path[1]);
    const day = form.days[index];

    if (day && !errors[day.weekday]) errors[day.weekday] = issue.message;
  }

  return errors;
}

export interface OpeningHoursGroup {
  /** "Seg a Sex", "Sáb", "Seg, Qua e Sex" */
  days: string;
  opens_at: string;
  closes_at: string;
}

/** ["Seg a Sex", "Dom"] → "Seg a Sex e Dom" */
function joinParts(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  if (parts.length === 2) return `${parts[0]} e ${parts[1]}`;

  return `${parts.slice(0, -1).join(", ")} e ${parts[parts.length - 1]}`;
}

/** Corridas de três dias ou mais viram intervalo; o resto é listado. */
function describeDays(days: Weekday[]): string {
  const runs: Weekday[][] = [];

  for (const day of days) {
    const current = runs[runs.length - 1];
    const previous = current?.[current.length - 1];
    const consecutive =
      previous !== undefined &&
      WEEKDAYS.indexOf(day) === WEEKDAYS.indexOf(previous) + 1;

    if (consecutive) current.push(day);
    else runs.push([day]);
  }

  const parts = runs.flatMap((run) =>
    run.length > 2
      ? `${WEEKDAY_SHORT_LABELS[run[0]]} a ${WEEKDAY_SHORT_LABELS[run[run.length - 1]]}`
      : run.map((day) => WEEKDAY_SHORT_LABELS[day]),
  );

  return joinParts(parts);
}

/**
 * Agrupa para leitura: os dias que compartilham a mesma faixa viram uma linha
 * só — "Seg a Sex" quando são seguidos, "Seg, Qua e Sex" quando não são. A
 * semana começa na segunda, então domingo é o último e não encosta nela.
 */
export function groupOpeningHours(hours: OpeningHour[]): OpeningHoursGroup[] {
  const ordered = WEEKDAYS.map((weekday) =>
    hours.find((hour) => hour.weekday === weekday),
  ).filter((hour) => hour !== undefined);

  const byRange = new Map<string, OpeningHour[]>();

  for (const hour of ordered) {
    const key = `${hour.opens_at}-${hour.closes_at}`;
    const group = byRange.get(key) ?? [];

    group.push(hour);
    byRange.set(key, group);
  }

  return [...byRange.values()].map((group) => ({
    days: describeDays(group.map((hour) => hour.weekday)),
    opens_at: toTimeInput(group[0].opens_at),
    closes_at: toTimeInput(group[0].closes_at),
  }));
}
