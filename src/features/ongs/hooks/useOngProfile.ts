import { useQuery } from "@tanstack/react-query";
import { fetchOngProfile } from "../services/ongs";
import { ongKeys } from "./queryKeys";

export function useOngProfile(id: string) {
  return useQuery({
    queryKey: ongKeys.profile(id),
    queryFn: () => fetchOngProfile(id),
    enabled: !!id,
  });
}
