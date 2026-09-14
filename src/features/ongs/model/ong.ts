export type VerificationStatus = "pending" | "approved" | "rejected";

/** O mínimo da ONG do usuário logado que o painel precisa. */
export interface MyOng {
  id: string;
  trade_name: string;
  verification_status: VerificationStatus;
}
