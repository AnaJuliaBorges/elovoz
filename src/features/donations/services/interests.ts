import { supabase } from "@/lib/supabase";
import { errorCode } from "@/lib/postgrest";
import type { Interest, MyInterest } from "../model/interest";
import type { InterestFormInput } from "../model/schema";

const INTEREST_COLUMNS =
  "id, need_id, donor_id, message, expected_quantity, expected_deadline, created_at";

async function currentUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user.id ?? null;
}

export function interestErrorMessage(
  error: unknown,
  fallback = "Não foi possível registrar seu interesse. Tente novamente.",
): string {
  // a policy de INSERT exige `current_user_type() = 'donor'`
  if (errorCode(error) === "42501") {
    return "Só quem tem conta de doador pode manifestar interesse.";
  }

  return fallback;
}

/** O interesse que o doador logado já manifestou nessa necessidade, se houver. */
export async function fetchMyInterest(
  needId: string,
): Promise<Interest | null> {
  const userId = await currentUserId();

  if (!userId) return null;

  const { data, error } = await supabase
    .from("interests")
    .select(INTEREST_COLUMNS)
    .eq("need_id", needId)
    .eq("donor_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return (data as Interest | null) ?? null;
}

/**
 * Histórico de interesses do doador logado, do mais recente para o mais
 * antigo. O filtro por `donor_id` é explícito porque a RLS deixa o admin ver
 * os de todo mundo.
 */
export async function fetchMyInterests(): Promise<MyInterest[]> {
  const userId = await currentUserId();

  if (!userId) return [];

  const { data, error } = await supabase
    .from("interests")
    .select(
      `${INTEREST_COLUMNS}, need:needs(id, title, status, ong:ongs(id, trade_name))`,
    )
    .eq("donor_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as unknown as MyInterest[];
}

/**
 * Interesses recebidos por uma necessidade. Quem decide o que volta é a
 * `interests_select_involved`: a ONG dona vê todos, o doador só o dele.
 */
export async function fetchNeedInterests(needId: string): Promise<Interest[]> {
  const { data, error } = await supabase
    .from("interests")
    .select(INTEREST_COLUMNS)
    .eq("need_id", needId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as Interest[];
}

export async function createInterest(
  needId: string,
  values: InterestFormInput,
): Promise<void> {
  const userId = await currentUserId();

  if (!userId) {
    throw new Error("Entre na sua conta para manifestar interesse.");
  }

  const { error } = await supabase.from("interests").insert({
    need_id: needId,
    donor_id: userId,
    message: values.message,
    expected_quantity: values.expected_quantity
      ? Number(values.expected_quantity)
      : null,
    expected_deadline: values.expected_deadline || null,
  });

  if (error) throw error;
}

export async function deleteInterest(id: string): Promise<void> {
  const { error } = await supabase.from("interests").delete().eq("id", id);

  if (error) throw error;
}
