import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  fetchNeed,
  fetchOngDashboardNeeds,
  fetchOngNeeds,
  searchNeeds,
} from "../services/needs";
import type { NeedFilters, NeedsPage } from "../model/need";
import { needKeys } from "./queryKeys";

export function nextSearchPage(
  lastPage: NeedsPage,
  allPages: NeedsPage[],
): number | undefined {
  const loaded = allPages.reduce((sum, page) => sum + page.needs.length, 0);

  return loaded < lastPage.total ? allPages.length : undefined;
}

export function useSearchNeeds(filters: NeedFilters) {
  return useInfiniteQuery({
    queryKey: needKeys.search(filters),
    queryFn: ({ pageParam }) => searchNeeds(filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: nextSearchPage,
  });
}

export function useNeed(id: string) {
  return useQuery({
    queryKey: needKeys.detail(id),
    queryFn: () => fetchNeed(id),
    enabled: !!id,
  });
}

/** O painel da ONG: as necessidades com a contagem de interesses. */
export function useOngDashboardNeeds(ongId: string | undefined) {
  return useQuery({
    queryKey: needKeys.dashboard(ongId ?? ""),
    queryFn: () => fetchOngDashboardNeeds(ongId!),
    enabled: !!ongId,
  });
}

export function useOngNeeds(ongId: string | undefined) {
  return useQuery({
    queryKey: needKeys.byOng(ongId ?? ""),
    queryFn: () => fetchOngNeeds(ongId!),
    enabled: !!ongId,
  });
}
