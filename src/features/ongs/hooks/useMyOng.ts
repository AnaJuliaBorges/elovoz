import { useQuery } from "@tanstack/react-query";
import { fetchMyOng } from "../services/ongs";

export const MY_ONG_QUERY_KEY = ["my-ong"] as const;

export function useMyOng({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: MY_ONG_QUERY_KEY,
    queryFn: fetchMyOng,
    enabled,
  });
}
