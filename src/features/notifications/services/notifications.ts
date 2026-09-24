import { supabase } from "@/lib/supabase";
import type { AppNotification } from "../model/notification";

/** A tela mostra só os avisos recentes; os mais velhos não somem do banco. */
export const NOTIFICATIONS_LIMIT = 50;

async function currentUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user.id ?? null;
}

/**
 * Avisos do doador logado, dos mais novos para os mais velhos. O filtro por
 * `donor_id` é explícito porque a RLS deixa o admin ver os de todo mundo.
 */
export async function fetchNotifications(): Promise<AppNotification[]> {
  const userId = await currentUserId();

  if (!userId) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, need_id, read, created_at, need:needs(id, title, urgency, ong:ongs(id, trade_name))",
    )
    .eq("donor_id", userId)
    .order("created_at", { ascending: false })
    .limit(NOTIFICATIONS_LIMIT);

  if (error) throw error;

  return (data ?? []) as unknown as AppNotification[];
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id);

  if (error) throw error;
}

export async function markAllNotificationsRead(): Promise<void> {
  const userId = await currentUserId();

  if (!userId) return;

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("donor_id", userId)
    .eq("read", false);

  if (error) throw error;
}

/**
 * Escuta os avisos novos do doador pelo Realtime. Devolve a função que
 * desliga a escuta. O filtro por `donor_id` economiza tráfego; quem garante
 * que ninguém recebe aviso alheio é a RLS de SELECT.
 */
export function subscribeToNewNotifications(
  donorId: string,
  onInsert: () => void,
): () => void {
  const channel = supabase
    .channel(`notifications:${donorId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `donor_id=eq.${donorId}`,
      },
      () => onInsert(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
