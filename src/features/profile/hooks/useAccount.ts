import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PROFILE_QUERY_KEY, updateProfile } from "@/features/auth";
import { deleteOwnAccount, fetchAccountEmail } from "../services/account";
import type { ProfileFormInput } from "../model/schema";

export function useAccountEmail() {
  return useQuery({
    queryKey: ["account", "email"],
    queryFn: fetchAccountEmail,
  });
}

export function useUpdateProfile(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["profile", "update"],
    mutationFn: (values: ProfileFormInput) => updateProfile(profileId, values),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY }),
  });
}

/** Depois de apagar, nada do cache pertence a mais ninguém: limpa tudo. */
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["account", "delete"],
    mutationFn: deleteOwnAccount,
    onSuccess: () => queryClient.clear(),
  });
}
