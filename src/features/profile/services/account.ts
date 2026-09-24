import { supabase } from "@/lib/supabase";

/** O e-mail fica em `auth.users`, não em `profiles`: vem da sessão. */
export async function fetchAccountEmail(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user.email ?? null;
}

/**
 * Apaga a conta inteira (RNF03/LGPD) pela função `delete_own_account`, que
 * remove o usuário de `auth.users` e deixa o cascade levar o resto. A sessão
 * local sai depois: no servidor ela já não vale mais nada.
 */
export async function deleteOwnAccount(): Promise<void> {
  const { error } = await supabase.rpc("delete_own_account");

  if (error) throw error;

  await supabase.auth.signOut({ scope: "local" });
}
