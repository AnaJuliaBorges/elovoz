import type { OngForReview, VerificationStatus } from "@/features/ongs";

export const VERIFICATION_TABS: {
  status: VerificationStatus;
  label: string;
  empty: string;
}[] = [
  {
    status: "pending",
    label: "Pendentes",
    empty: "Nenhuma instituição aguardando análise.",
  },
  {
    status: "approved",
    label: "Aprovadas",
    empty: "Nenhuma instituição aprovada ainda.",
  },
  {
    status: "rejected",
    label: "Recusadas",
    empty: "Nenhuma instituição recusada.",
  },
];

/** Separa a fila por status, mantendo a ordem de chegada. */
export function groupByStatus(
  ongs: OngForReview[],
): Record<VerificationStatus, OngForReview[]> {
  const groups: Record<VerificationStatus, OngForReview[]> = {
    pending: [],
    approved: [],
    rejected: [],
  };

  for (const ong of ongs) groups[ong.verification_status].push(ong);

  return groups;
}

export interface ReviewAction {
  to: VerificationStatus;
  label: string;
  success: string;
  /** Ações que tiram a ONG do ar pedem confirmação antes. */
  confirm?: { title: string; description: string };
}

const APPROVE: ReviewAction = {
  to: "approved",
  label: "Aprovar",
  success: "Instituição aprovada. O perfil já aparece para os doadores.",
};

/** O que o admin pode fazer com a ONG em cada status (RF08). */
export const ACTIONS_BY_STATUS: Record<VerificationStatus, ReviewAction[]> = {
  pending: [
    APPROVE,
    {
      to: "rejected",
      label: "Recusar",
      success: "Cadastro recusado.",
      confirm: {
        title: "Recusar este cadastro?",
        description:
          "A instituição não poderá publicar necessidades e o perfil não aparece para os doadores. Dá para aprovar depois, se for o caso.",
      },
    },
  ],
  approved: [
    {
      to: "rejected",
      label: "Revogar aprovação",
      success: "Aprovação revogada. O perfil saiu do ar.",
      confirm: {
        title: "Revogar a aprovação?",
        description:
          "O perfil e as necessidades da instituição deixam de aparecer para os doadores, e ela não consegue publicar novas.",
      },
    },
  ],
  rejected: [APPROVE],
};
