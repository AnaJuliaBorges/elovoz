import { supabase } from "@/lib/supabase";
import { errorCode } from "@/lib/postgrest";
import { onlyDigits } from "@/lib/masks";
import type { OngContactFormInput, OngIdentityFormInput } from "../model/ongForm";
import type {
  MyOng,
  OngEditable,
  OngForReview,
  OngProfile,
  VerificationStatus,
} from "../model/ong";

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

const ONG_REVIEW_COLUMNS = `
  id, profile_id, trade_name, legal_name, cnpj, mission, neighborhood, address,
  instagram, facebook, website, verification_status, created_at,
  city:cities(name), state:states(uf),
  contacts:ong_contacts(id, number, whatsapp),
  responsible:profiles(name, phone)
`;

/**
 * Todas as ONGs, em qualquer status, das mais antigas para as mais novas: a
 * fila de verificação do admin (RF08). Só o admin recebe as de outros
 * donos — para qualquer outro papel a RLS devolve só as aprovadas e a própria.
 */
export async function fetchOngsForReview(): Promise<OngForReview[]> {
  const { data, error } = await supabase
    .from("ongs")
    .select(ONG_REVIEW_COLUMNS)
    .order("created_at");

  if (error) throw error;

  return (data ?? []) as unknown as OngForReview[];
}

/**
 * Aprova ou recusa a ONG. Quem barra quem não é admin é o trigger
 * `prevent_verification_status_change`; o `.select().single()` ainda
 * transforma um UPDATE filtrado pela RLS (zero linhas) em `PGRST116`.
 */
export async function setOngVerificationStatus(
  id: string,
  status: VerificationStatus,
): Promise<void> {
  const { error } = await supabase
    .from("ongs")
    .update({ verification_status: status })
    .eq("id", id)
    .select("id")
    .single();

  if (error) throw error;
}

const ONG_EDITABLE_COLUMNS = `
  id, trade_name, legal_name, cnpj, mission, state_id, city_id, neighborhood,
  address, instagram, facebook, website,
  contacts:ong_contacts(id, number, whatsapp)
`;

/** A ONG com os campos que o painel edita. */
export async function fetchOngForEdit(id: string): Promise<OngEditable | null> {
  const { data, error } = await supabase
    .from("ongs")
    .select(ONG_EDITABLE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  return (data as unknown as OngEditable | null) ?? null;
}

/**
 * Nome fantasia e missão. Razão social e CNPJ não passam por aqui: são o que
 * o admin conferiu para aprovar a ONG.
 */
export async function updateOngIdentity(
  id: string,
  values: OngIdentityFormInput,
): Promise<void> {
  const { error } = await supabase
    .from("ongs")
    .update({ trade_name: values.trade_name, mission: values.mission })
    .eq("id", id)
    .select("id")
    .single();

  if (error) throw error;
}

/**
 * Endereço e redes em `ongs`; os telefones são substituídos inteiros (apaga e
 * regrava), como os horários — para poucas linhas sai mais simples que
 * comparar uma a uma.
 */
export async function updateOngContact(
  id: string,
  values: OngContactFormInput,
): Promise<void> {
  const { error } = await supabase
    .from("ongs")
    .update({
      state_id: values.state_id,
      city_id: values.city_id,
      neighborhood: values.neighborhood,
      address: values.address,
      instagram: values.instagram || null,
      facebook: values.facebook || null,
      website: values.website || null,
    })
    .eq("id", id)
    .select("id")
    .single();

  if (error) throw error;

  const { error: deleteError } = await supabase
    .from("ong_contacts")
    .delete()
    .eq("ong_id", id);

  if (deleteError) throw deleteError;

  const { error: insertError } = await supabase.from("ong_contacts").insert(
    values.contacts.map((contact) => ({
      ong_id: id,
      number: onlyDigits(contact.number),
      whatsapp: contact.whatsapp,
    })),
  );

  if (insertError) throw insertError;
}
