import { supabase } from "@/lib/supabase";
import type { Category } from "../model/need";

const LAST_CATEGORY = "Outros";

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, icon")
    .order("name");

  if (error) throw error;

  // "Outros" é o curinga: fica no fim, não no meio da ordem alfabética
  return ((data ?? []) as Category[]).sort(
    (a, b) =>
      Number(a.name === LAST_CATEGORY) - Number(b.name === LAST_CATEGORY),
  );
}
