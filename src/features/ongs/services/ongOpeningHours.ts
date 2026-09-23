import { supabase } from "@/lib/supabase";
import type { OpeningHour } from "../model/openingHours";

const OPENING_HOURS_COLUMNS = "weekday, opens_at, closes_at";

export async function fetchOngOpeningHours(
  ongId: string,
): Promise<OpeningHour[]> {
  const { data, error } = await supabase
    .from("ong_opening_hours")
    .select(OPENING_HOURS_COLUMNS)
    .eq("ong_id", ongId)
    .order("weekday");

  if (error) throw error;

  return (data ?? []) as OpeningHour[];
}

/**
 * Substitui a semana inteira: apaga o que havia e grava os dias abertos. Sem
 * transação pelo client, mas a janela é curta e a alternativa (diferença linha
 * a linha) não paga o custo para sete linhas.
 */
export async function saveOngOpeningHours(
  ongId: string,
  hours: OpeningHour[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("ong_opening_hours")
    .delete()
    .eq("ong_id", ongId);

  if (deleteError) throw deleteError;

  if (hours.length === 0) return;

  const { error } = await supabase.from("ong_opening_hours").insert(
    hours.map((hour) => ({
      ong_id: ongId,
      weekday: hour.weekday,
      opens_at: hour.opens_at,
      closes_at: hour.closes_at,
    })),
  );

  if (error) throw error;
}
