/**
 * Código de erro do PostgREST/Postgres, quando vem. Os que aparecem no app:
 * `42501` (RLS recusou a escrita), `PGRST116` (`.single()` sem linha, quase
 * sempre RLS filtrando) e `22P02` (uuid inválido na URL).
 */
export function errorCode(error: unknown): unknown {
  return typeof error === "object" && error !== null && "code" in error
    ? error.code
    : undefined;
}
