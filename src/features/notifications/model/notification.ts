import type { Urgency } from "@/features/needs";

/**
 * Aviso de nova necessidade de uma ONG que o doador segue (RF09). Quem grava
 * é o trigger `notify_followers_on_new_need`; o client só lê e marca como
 * lido. `need` vem `null` quando a necessidade deixou de ser visível (ONG
 * recusada depois de publicar).
 */
export interface AppNotification {
  id: string;
  need_id: string;
  read: boolean;
  created_at: string;
  need: {
    id: string;
    title: string;
    urgency: Urgency;
    ong: { id: string; trade_name: string } | null;
  } | null;
}
