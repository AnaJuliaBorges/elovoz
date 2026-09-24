import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchFollowedOngs,
  fetchIsFollowingOng,
  followOng,
  unfollowOng,
} from "../services/ongFollowers";
import { ongKeys } from "./queryKeys";

/** Só faz sentido para doador: a policy de INSERT recusa os outros papéis. */
export function useIsFollowingOng(
  ongId: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ongKeys.following(ongId),
    queryFn: () => fetchIsFollowingOng(ongId),
    enabled: enabled && !!ongId,
  });
}

/** ONGs que o doador segue — a aba de "Minhas doações". */
export function useFollowedOngs({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ongKeys.followed,
    queryFn: fetchFollowedOngs,
    enabled,
  });
}

/**
 * Recebe o estado atual e faz o contrário dele. O `return` do `onSuccess`
 * segura a mutação pendente até o refetch acabar, então o botão não pisca o
 * rótulo antigo.
 */
export function useToggleFollowOng(ongId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["ongs", "follow", ongId],
    mutationFn: (following: boolean) =>
      following ? unfollowOng(ongId) : followOng(ongId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ongKeys.following(ongId) }),
        queryClient.invalidateQueries({ queryKey: ongKeys.followed }),
      ]),
  });
}
