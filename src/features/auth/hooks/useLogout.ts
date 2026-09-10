import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return async function logout() {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate("/login", { replace: true });
  };
}
