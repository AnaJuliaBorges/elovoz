import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteUser, fetchAdminUsers } from "../services/users";

export const ADMIN_USERS_QUERY_KEY = ["admin", "users"] as const;

export function useAdminUsers() {
  return useQuery({
    queryKey: ADMIN_USERS_QUERY_KEY,
    queryFn: fetchAdminUsers,
  });
}

/**
 * Excluir uma ONG leva junto a instituição e as necessidades: além das contas,
 * invalida a fila de verificação (`["admin"]` cobre as duas), ONGs e
 * necessidades.
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["admin", "users", "delete"],
    mutationFn: deleteUser,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin"] }),
        queryClient.invalidateQueries({ queryKey: ["ongs"] }),
        queryClient.invalidateQueries({ queryKey: ["needs"] }),
      ]),
  });
}
