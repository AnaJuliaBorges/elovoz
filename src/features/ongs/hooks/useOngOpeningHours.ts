import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchOngOpeningHours,
  saveOngOpeningHours,
} from "../services/ongOpeningHours";
import type { OpeningHour } from "../model/openingHours";
import { ongKeys } from "./queryKeys";

export function useOngOpeningHours(ongId: string | undefined) {
  return useQuery({
    queryKey: ongKeys.openingHours(ongId ?? ""),
    queryFn: () => fetchOngOpeningHours(ongId!),
    enabled: !!ongId,
  });
}

export function useSaveOngOpeningHours(ongId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["ongs", "opening-hours", ongId],
    mutationFn: (hours: OpeningHour[]) => saveOngOpeningHours(ongId, hours),
    // o perfil público mostra os mesmos horários
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ongKeys.all }),
  });
}
