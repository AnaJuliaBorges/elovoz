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
  /**
   * O doador autorizou a ONG a ver o contato dele neste interesse. Nome,
   * e-mail e telefone são preenchidos pelo trigger `fill_interest_contact` a
   * partir do cadastro, e ficam nulos quando não há autorização.
   */
  share_contact: boolean;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  /** Quando a ONG marcou como respondido; `null` é ainda sem resposta. */
  answered_at: string | null;
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
