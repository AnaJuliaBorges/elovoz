/** Data de hoje no fuso do navegador, no formato das colunas `date` (AAAA-MM-DD). */
export function todayIso(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Coluna `date` (AAAA-MM-DD) → DD/MM/AAAA. Não passa por `new Date()`: a
 * string seria lida como meia-noite UTC e, no Brasil, voltaria um dia.
 */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-");

  return `${day}/${month}/${year}`;
}

/**
 * DD/MM/AAAA → AAAA-MM-DD, o formato das colunas `date`. Devolve `null` se a
 * data não existe (31/02, 00/05...) ou está incompleta. Confere montando um
 * `Date` em UTC, sem risco de fuso.
 */
export function parseBrDate(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());

  if (!match) return null;

  const [, day, month, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  const valid =
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day);

  return valid ? `${year}-${month}-${day}` : null;
}
