/**
 * Para onde voltar depois de entrar ou criar a conta: o visitante que tocou
 * em "Tenho interesse" ou "Seguir" volta para a mesma tela.
 */
export const REDIRECT_PARAM = "voltar";

/** `/cadastrar?tipo=ong` abre o cadastro com "Sou uma ONG" já marcado. */
export const SIGNUP_TYPE_PARAM = "tipo";
export const ONG_SIGNUP_PATH = `/cadastrar?${SIGNUP_TYPE_PARAM}=ong`;

/** "/login" + "/necessidades/1" → "/login?voltar=%2Fnecessidades%2F1" */
export function withRedirect(path: string, returnTo: string): string {
  return `${path}?${new URLSearchParams({ [REDIRECT_PARAM]: returnTo })}`;
}

/**
 * Só aceita caminho interno do app. `//site.com` e `/\site.com` o navegador
 * lê como outro domínio, e aí um link de login montado por terceiros levaria
 * a pessoa para fora depois de entrar (open redirect).
 */
export function safeRedirect(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;

  return value;
}
