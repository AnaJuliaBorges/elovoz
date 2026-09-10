import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { reportError } from "./reportError";

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        reportError(error, {
          source: "query",
          detail: JSON.stringify(query.queryKey),
        });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        const { mutationKey } = mutation.options;

        reportError(error, {
          source: "mutation",
          detail: mutationKey ? JSON.stringify(mutationKey) : undefined,
        });
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutos
        gcTime: 10 * 60 * 1000, // 10 minutos
        retry: 2,
        refetchOnWindowFocus: false,
      },
    },
  });
}
