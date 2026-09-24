import type { NeedStatus } from "@/features/needs";

/** Interesse de um doador numa necessidade (RF06). */
export interface Interest {
  id: string;
  need_id: string;
  donor_id: string;
  message: string | null;
  expected_quantity: number | null;
  expected_deadline: string | null;
  created_at: string;
}

/**
 * Interesse do doador logado com a necessidade e a ONG junto — o histórico de
 * "Minhas doações". `need` vem `null` quando a necessidade deixou de ser
 * visível para o doador (a ONG foi recusada pelo admin).
 */
export interface MyInterest extends Interest {
  need: {
    id: string;
    title: string;
    status: NeedStatus;
    ong: { id: string; trade_name: string } | null;
  } | null;
}
