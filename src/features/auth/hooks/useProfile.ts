import { useQuery } from "@tanstack/react-query";
import { fetchCurrentProfile } from "../services/profiles";

export const PROFILE_QUERY_KEY = ["profile"] as const;

/** Perfil do usuário logado — o `user_type` daqui decide menu e rotas. */
export function useProfile() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: fetchCurrentProfile,
  });
}
