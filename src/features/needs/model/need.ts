export type Urgency = "low" | "medium" | "high";

export type NeedStatus = "open" | "partially_fulfilled" | "fulfilled";

export const URGENCIES: Urgency[] = ["low", "medium", "high"];

export const NEED_STATUSES: NeedStatus[] = [
  "open",
  "partially_fulfilled",
  "fulfilled",
];

export const URGENCY_LABELS: Record<Urgency, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

export const NEED_STATUS_LABELS: Record<NeedStatus, string> = {
  open: "Aberta",
  partially_fulfilled: "Parcialmente atendida",
  fulfilled: "Atendida",
};

export interface Category {
  id: string;
  name: string;
  icon: string | null;
}

export interface Need {
  id: string;
  ong_id: string;
  category_id: string;
  title: string;
  description: string | null;
  quantity: number | null;
  urgency: Urgency;
  deadline: string | null;
  status: NeedStatus;
  created_at: string;
  updated_at: string;
}

export interface NeedWithCategory extends Need {
  category: { id: string; name: string } | null;
}

/** Necessidade como as telas de busca e detalhe mostram: com a ONG junto. */
export interface NeedWithOng extends NeedWithCategory {
  ong: {
    id: string;
    trade_name: string;
    neighborhood: string;
    city: { name: string } | null;
    state: { uf: string } | null;
  };
}

export interface NeedsPage {
  needs: NeedWithOng[];
  total: number;
}

export interface NeedFilters {
  categoryId?: string;
  urgency?: Urgency;
  stateId?: string;
  cityId?: string;
  neighborhood?: string;
}

/** "Centro, Rio de Janeiro - RJ" */
export function formatOngLocation(ong: NeedWithOng["ong"]): string {
  const city = ong.city
    ? `${ong.city.name}${ong.state ? ` - ${ong.state.uf}` : ""}`
    : null;

  return [ong.neighborhood, city].filter(Boolean).join(", ");
}
