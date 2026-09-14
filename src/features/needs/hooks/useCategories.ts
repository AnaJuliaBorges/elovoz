import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "../services/categories";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    // só o admin mexe nas categorias: não vale refazer a busca na sessão
    staleTime: Infinity,
  });
}
