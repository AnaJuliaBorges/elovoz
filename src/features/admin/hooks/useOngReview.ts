import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchOngsForReview,
  setOngVerificationStatus,
  type VerificationStatus,
} from "@/features/ongs";

export const ADMIN_ONGS_QUERY_KEY = ["admin", "ongs"] as const;

export function useOngsForReview() {
  return useQuery({
    queryKey: ADMIN_ONGS_QUERY_KEY,
    queryFn: fetchOngsForReview,
  });
}

/**
 * Além da fila, invalida tudo de `ongs` e `needs`: aprovar ou revogar muda o
 * que o perfil público e a busca devolvem.
 */
export function useSetOngStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["admin", "ongs", "status"],
    mutationFn: ({ id, status }: { id: string; status: VerificationStatus }) =>
      setOngVerificationStatus(id, status),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ADMIN_ONGS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ["ongs"] }),
        queryClient.invalidateQueries({ queryKey: ["needs"] }),
      ]),
  });
}
