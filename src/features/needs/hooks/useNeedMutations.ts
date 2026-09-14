import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createNeed,
  deleteNeed,
  updateNeed,
  updateNeedStatus,
} from "../services/needs";
import type { NeedStatus } from "../model/need";
import type { NeedFormInput } from "../model/schema";
import { needKeys } from "./queryKeys";

// toda escrita invalida `["needs"]` inteiro: busca, detalhe e painel mostram
// a mesma linha. O `return` segura a mutação pendente até o refetch acabar,
// então a tela não pisca o valor antigo

export function useCreateNeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["needs", "create"],
    mutationFn: ({ ongId, values }: { ongId: string; values: NeedFormInput }) =>
      createNeed(ongId, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: needKeys.all }),
  });
}

export function useUpdateNeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["needs", "update"],
    mutationFn: ({ id, values }: { id: string; values: NeedFormInput }) =>
      updateNeed(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: needKeys.all }),
  });
}

export function useUpdateNeedStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["needs", "status"],
    mutationFn: ({ id, status }: { id: string; status: NeedStatus }) =>
      updateNeedStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: needKeys.all }),
  });
}

export function useDeleteNeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["needs", "delete"],
    mutationFn: (id: string) => deleteNeed(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: needKeys.all }),
  });
}
