import { supabase } from "@/lib/supabase";
import { onlyDigits } from "@/lib/masks";
import type { Profile, UserType } from "../model/profile";

const PROFILE_COLUMNS = "id, user_type, name, phone, created_at";

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as Profile | null) ?? null;
}

/**
 * O banco não tem trigger criando `profiles` — a linha é inserida aqui,
 * já autenticado, porque a policy `profiles_insert_own` exige
 * `id = auth.uid()`.
 */
export async function createProfile(input: {
  id: string;
  name: string;
  phone?: string;
  user_type: Exclude<UserType, "admin">;
}): Promise<void> {
  const { error } = await supabase.from("profiles").insert({
    id: input.id,
    name: input.name,
    phone: input.phone ? onlyDigits(input.phone) : null,
    user_type: input.user_type,
  });

  if (error) throw error;
}

/**
 * Atualiza nome e telefone. O `.select().single()` transforma um UPDATE
 * barrado pela RLS (zero linhas, sem erro) em `PGRST116`.
 */
export async function updateProfile(
  id: string,
  input: { name: string; phone?: string },
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      name: input.name.trim(),
      phone: input.phone ? onlyDigits(input.phone) : null,
    })
    .eq("id", id)
    .select("id")
    .single();

  if (error) throw error;
}

export async function fetchCurrentProfile(): Promise<Profile | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  return fetchProfile(session.user.id);
}
