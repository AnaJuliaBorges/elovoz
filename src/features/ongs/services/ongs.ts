import { supabase } from "@/lib/supabase";
import type { MyOng } from "../model/ong";

/**
 * ONG do usuário logado, em qualquer status — a policy de SELECT deixa o
 * dono ver a própria linha mesmo antes da aprovação.
 */
export async function fetchMyOng(): Promise<MyOng | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const { data, error } = await supabase
    .from("ongs")
    .select("id, trade_name, verification_status")
    .eq("profile_id", session.user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as MyOng | null) ?? null;
}
