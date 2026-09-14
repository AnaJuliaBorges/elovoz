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
