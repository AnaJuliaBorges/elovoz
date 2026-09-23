import { supabase } from "@/lib/supabase";
import { errorCode } from "@/lib/postgrest";

async function currentUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user.id ?? null;
}

export function followErrorMessage(error: unknown): string {
  // a policy de INSERT só aceita `donor_id = auth.uid()` de quem é doador
  if (errorCode(error) === "42501") {
    return "Só quem tem conta de doador pode seguir instituições.";
  }

  return "Não foi possível atualizar. Tente novamente.";
}

/**
 * Se o doador logado segue a ONG (RF11). A policy de SELECT só devolve as
 * próprias linhas, mas o filtro por `donor_id` também é explícito porque um
 * admin enxerga as de todo mundo.
 */
export async function fetchIsFollowingOng(ongId: string): Promise<boolean> {
  const userId = await currentUserId();

  if (!userId) return false;

  const { data, error } = await supabase
    .from("ong_followers")
    .select("id")
    .eq("ong_id", ongId)
    .eq("donor_id", userId)
    .maybeSingle();

  if (error) throw error;

  return !!data;
}

export async function followOng(ongId: string): Promise<void> {
  const userId = await currentUserId();

  if (!userId) throw new Error("Entre na sua conta para seguir a instituição.");

  const { error } = await supabase
    .from("ong_followers")
    .insert({ ong_id: ongId, donor_id: userId });

  // o par (donor_id, ong_id) é único: seguir de novo é sucesso, não erro
  if (error && errorCode(error) !== "23505") throw error;
}

export async function unfollowOng(ongId: string): Promise<void> {
  const userId = await currentUserId();

  if (!userId) return;

  const { error } = await supabase
    .from("ong_followers")
    .delete()
    .eq("ong_id", ongId)
    .eq("donor_id", userId);

  if (error) throw error;
}
