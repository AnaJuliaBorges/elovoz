import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createInterest,
  deleteInterest,
  setInterestAnswered,
} from "../services/interests";
import type { InterestFormInput } from "../model/schema";
import { interestKeys } from "./queryKeys";

// toda escrita invalida `["interests"]` inteiro: o card do doador e a lista
// que a ONG vê saem da mesma linha

export function useCreateInterest(needId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["interests", "create", needId],
    mutationFn: (values: InterestFormInput) => createInterest(needId, values),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: interestKeys.all }),
  });
}

export function useDeleteInterest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["interests", "delete"],
    mutationFn: (id: string) => deleteInterest(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: interestKeys.all }),
  });
}

/**
 * Além dos interesses, invalida `["needs"]`: o painel da ONG conta quantos
 * foram respondidos em cada necessidade.
 */
export function useSetInterestAnswered() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["interests", "answered"],
    mutationFn: ({ id, answered }: { id: string; answered: boolean }) =>
      setInterestAnswered(id, answered),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: interestKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["needs"] }),
      ]),
  });
}
