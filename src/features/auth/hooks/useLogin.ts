import { AuthError } from "@supabase/supabase-js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { fetchProfile } from "../services/profiles";
import { PROFILE_QUERY_KEY } from "./useProfile";
import { homeFor } from "../model/profile";

export function loginErrorMessage(error: unknown): string {
  if (error instanceof AuthError) {
    if (error.code === "invalid_credentials") return "E-mail ou senha inválidos";
    if (error.code === "email_not_confirmed") {
      return "Confirme seu e-mail antes de entrar";
    }
    return error.message;
  }

  return "Não foi possível entrar. Tente novamente.";
}

export function useLogin() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ["login"],
    mutationFn: async (input: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword(input);

      if (error) throw error;

      const profile = await fetchProfile(data.user.id);
      queryClient.setQueryData(PROFILE_QUERY_KEY, profile);

      return homeFor(profile?.user_type);
    },
  });

  return {
    login: mutation.mutateAsync,
    loading: mutation.isPending,
    error: mutation.error ? loginErrorMessage(mutation.error) : null,
  };
}
