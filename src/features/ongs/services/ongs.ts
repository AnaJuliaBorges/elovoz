import { supabase } from "@/lib/supabase";
import { errorCode } from "@/lib/postgrest";
import type { MyOng, OngProfile } from "../model/ong";

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

// `city` e `state` são muitos-para-um e chegam como objeto, `contacts` como
// lista; sem os tipos gerados do banco o supabase-js tipa todo embed como
// lista, daí o `as unknown as`
const ONG_PROFILE_COLUMNS = `
  id, profile_id, trade_name, legal_name, cnpj, mission, neighborhood, address,
  instagram, facebook, website, verification_status, created_at,
  city:cities(name), state:states(uf),
  contacts:ong_contacts(id, number, whatsapp),
  opening_hours:ong_opening_hours(weekday, opens_at, closes_at)
`;

/**
 * Perfil público da ONG (RF05). A RLS decide o que existe: doador só enxerga
 * ONG aprovada, então uma pendente volta `null` para quem não é a dona nem
 * admin.
 */
export async function fetchOngProfile(id: string): Promise<OngProfile | null> {
  const { data, error } = await supabase
    .from("ongs")
    .select(ONG_PROFILE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  // id que não é uuid (link digitado errado) é "não encontrada", não erro
  if (errorCode(error) === "22P02") return null;
  if (error) throw error;

  return (data as unknown as OngProfile | null) ?? null;
}
