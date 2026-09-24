import { useQuery } from "@tanstack/react-query";
import {
  fetchMyInterest,
  fetchMyInterests,
  fetchNeedInterests,
} from "../services/interests";
import { interestKeys } from "./queryKeys";

/** Só faz sentido para doador: os outros papéis nunca têm interesse próprio. */
export function useMyInterest(
  needId: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: interestKeys.mine(needId),
    queryFn: () => fetchMyInterest(needId),
    enabled: enabled && !!needId,
  });
}

export function useNeedInterests(
  needId: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: interestKeys.forNeed(needId),
    queryFn: () => fetchNeedInterests(needId),
    enabled: enabled && !!needId,
  });
}

/** Todos os interesses do doador logado — a aba de "Minhas doações". */
export function useMyInterests() {
  return useQuery({
    queryKey: interestKeys.history,
    queryFn: fetchMyInterests,
  });
}
