import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchOngForEdit,
  updateOngContact,
  updateOngIdentity,
} from "../services/ongs";
import type {
  OngContactFormInput,
  OngIdentityFormInput,
} from "../model/ongForm";
import { MY_ONG_QUERY_KEY } from "./useMyOng";
import { ongKeys } from "./queryKeys";

export function useOngForEdit(ongId: string | undefined) {
  return useQuery({
    queryKey: ongKeys.edit(ongId ?? ""),
    queryFn: () => fetchOngForEdit(ongId!),
    enabled: !!ongId,
  });
}

// o perfil público, a busca (nome e bairro no card) e o painel (nome no
// topo) mostram esses dados: toda escrita invalida os três
function useInvalidateOngData() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ongKeys.all }),
      queryClient.invalidateQueries({ queryKey: MY_ONG_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ["needs"] }),
    ]);
}

export function useUpdateOngIdentity(ongId: string) {
  const invalidate = useInvalidateOngData();

  return useMutation({
    mutationKey: ["ongs", "identity", ongId],
    mutationFn: (values: OngIdentityFormInput) =>
      updateOngIdentity(ongId, values),
    onSuccess: invalidate,
  });
}

export function useUpdateOngContact(ongId: string) {
  const invalidate = useInvalidateOngData();

  return useMutation({
    mutationKey: ["ongs", "contact", ongId],
    mutationFn: (values: OngContactFormInput) =>
      updateOngContact(ongId, values),
    onSuccess: invalidate,
  });
}
