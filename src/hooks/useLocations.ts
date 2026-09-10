import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

export interface State {
  id: string;
  name: string;
  uf: string;
}

export interface City {
  id: string;
  name: string;
  state_id: string;
}

async function getStates(): Promise<State[]> {
  const { data, error } = await supabase
    .from("states")
    .select("id, name, uf")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

async function getCities(stateId: string): Promise<City[]> {
  const { data, error } = await supabase
    .from("cities")
    .select("id, name, state_id")
    .eq("state_id", stateId)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export function useStates() {
  return useQuery({
    queryKey: ["states"],
    queryFn: getStates,
  });
}

export function useCities(stateId?: string) {
  return useQuery({
    queryKey: ["cities", stateId],
    enabled: !!stateId,
    queryFn: () => getCities(stateId!),
  });
}
