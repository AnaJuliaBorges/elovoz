import { supabase } from "@/lib/supabase";
import { todayIso } from "@/lib/dates";
import { errorCode } from "@/lib/postgrest";
import type {
  NeedFilters,
  NeedStatus,
  NeedWithCategory,
  NeedWithOng,
  NeedsPage,
} from "../model/need";
import type { NeedFormInput } from "../model/schema";

export const NEEDS_PAGE_SIZE = 12;

const NEED_COLUMNS =
  "id, ong_id, category_id, title, description, quantity, urgency, deadline, status, created_at, updated_at";

// sem os tipos gerados do banco, o supabase-js tipa todo embed como lista;
// `category`, `ong`, `city` e `state` são muitos-para-um e chegam como
// objeto — daí os `as unknown as` abaixo
const NEED_WITH_CATEGORY_COLUMNS = `${NEED_COLUMNS}, category:categories(id, name)`;

// `!inner` vira JOIN: sem ele, o filtro em `ong.city_id` só esvaziaria o
// objeto `ong` e a necessidade continuaria na lista
const NEED_WITH_ONG_COLUMNS = `${NEED_WITH_CATEGORY_COLUMNS}, ong:ongs!inner(id, trade_name, neighborhood, state_id, city_id, city:cities(name), state:states(uf))`;

export function needErrorMessage(
  error: unknown,
  fallback = "Não foi possível salvar a necessidade. Tente novamente.",
): string {
  // RLS recusando o INSERT: a policy só aceita ONG com status `approved`
  if (errorCode(error) === "42501") {
    return "Sua ONG precisa estar aprovada para publicar necessidades.";
  }

  // `.single()` sem linha: a RLS filtrou o UPDATE/DELETE, não é da ONG
  if (errorCode(error) === "PGRST116") {
    return "Não encontramos essa necessidade ou você não tem permissão para alterá-la.";
  }

  return fallback;
}

/** `%` e `_` digitados pelo usuário são literais, não curingas do ILIKE. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

/**
 * Busca do doador (RF04): só o que ainda dá para atender — aberta ou
 * parcialmente atendida e dentro do prazo —, das mais urgentes para as
 * menos. A RLS já esconde as ONGs não aprovadas.
 */
export async function searchNeeds(
  filters: NeedFilters,
  page = 0,
): Promise<NeedsPage> {
  const from = page * NEEDS_PAGE_SIZE;

  let query = supabase
    .from("needs")
    .select(NEED_WITH_ONG_COLUMNS, { count: "exact" })
    .in("status", ["open", "partially_fulfilled"])
    .or(`deadline.is.null,deadline.gte.${todayIso()}`);

  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.urgency) query = query.eq("urgency", filters.urgency);
  if (filters.stateId) query = query.eq("ong.state_id", filters.stateId);
  if (filters.cityId) query = query.eq("ong.city_id", filters.cityId);
  if (filters.neighborhood) {
    query = query.ilike(
      "ong.neighborhood",
      `%${escapeLike(filters.neighborhood)}%`,
    );
  }

  // o enum `urgency_level` é ordenado low → medium → high
  const { data, error, count } = await query
    .order("urgency", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, from + NEEDS_PAGE_SIZE - 1);

  if (error) throw error;

  return {
    needs: (data ?? []) as unknown as NeedWithOng[],
    total: count ?? 0,
  };
}

export async function fetchNeed(id: string): Promise<NeedWithOng | null> {
  const { data, error } = await supabase
    .from("needs")
    .select(NEED_WITH_ONG_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  // id que não é uuid (link digitado errado) é "não encontrada", não erro
  if (errorCode(error) === "22P02") return null;
  if (error) throw error;

  return (data as unknown as NeedWithOng | null) ?? null;
}

export async function fetchOngNeeds(ongId: string): Promise<NeedWithCategory[]> {
  const { data, error } = await supabase
    .from("needs")
    .select(NEED_WITH_CATEGORY_COLUMNS)
    .eq("ong_id", ongId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as unknown as NeedWithCategory[];
}

function toNeedPayload(values: NeedFormInput) {
  return {
    title: values.title,
    category_id: values.category_id,
    description: values.description || null,
    quantity: values.quantity ? Number(values.quantity) : null,
    urgency: values.urgency,
    deadline: values.deadline || null,
  };
}

export async function createNeed(
  ongId: string,
  values: NeedFormInput,
): Promise<string> {
  const { data, error } = await supabase
    .from("needs")
    .insert({ ong_id: ongId, ...toNeedPayload(values) })
    .select("id")
    .single();

  if (error) throw error;

  return (data as { id: string }).id;
}

// UPDATE/DELETE barrados pela RLS não dão erro, só afetam zero linhas:
// o `.select("id").single()` transforma isso em erro PGRST116

export async function updateNeed(
  id: string,
  values: NeedFormInput,
): Promise<void> {
  const { error } = await supabase
    .from("needs")
    .update(toNeedPayload(values))
    .eq("id", id)
    .select("id")
    .single();

  if (error) throw error;
}

export async function updateNeedStatus(
  id: string,
  status: NeedStatus,
): Promise<void> {
  const { error } = await supabase
    .from("needs")
    .update({ status })
    .eq("id", id)
    .select("id")
    .single();

  if (error) throw error;
}

export async function deleteNeed(id: string): Promise<void> {
  const { error } = await supabase
    .from("needs")
    .delete()
    .eq("id", id)
    .select("id")
    .single();

  if (error) throw error;
}
