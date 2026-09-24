import { supabase } from "@/lib/supabase";
import type { AdminUser } from "../model/user";

/**
 * Todas as contas, das mais novas para as mais antigas. É RPC porque o e-mail
 * e o último acesso moram em `auth.users`, fora do alcance do client; a
 * função devolve vazio para quem não é admin.
 */
export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase.rpc("admin_list_users");

  if (error) throw error;

  return (data ?? []) as AdminUser[];
}

/**
 * Exclui a conta pela função `admin_delete_user`, que apaga o login e deixa o
 * cascade levar o resto. A função recusa (`42501`) o próprio admin e outros
 * admins.
 */
export async function deleteUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc("admin_delete_user", {
    p_user_id: userId,
  });

  if (error) throw error;
}
