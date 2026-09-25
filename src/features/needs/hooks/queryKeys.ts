import type { NeedFilters } from "../model/need";

export const needKeys = {
  all: ["needs"] as const,
  search: (filters: NeedFilters) => ["needs", "search", filters] as const,
  detail: (id: string) => ["needs", "detail", id] as const,
  byOng: (ongId: string) => ["needs", "ong", ongId] as const,
  dashboard: (ongId: string) => ["needs", "dashboard", ongId] as const,
};
