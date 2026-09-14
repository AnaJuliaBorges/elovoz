import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchX } from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { NeedCard } from "../components/NeedCard";
import { NeedFiltersBar } from "../components/NeedFiltersBar";
import { useSearchNeeds } from "../hooks/useNeedQueries";
import { filtersFromParams, filtersToParams } from "../model/filters";
import type { NeedFilters } from "../model/need";

export default function SearchNeedsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => filtersFromParams(searchParams), [searchParams]);

  const handleFiltersChange = useCallback(
    (next: NeedFilters) => {
      const params = filtersToParams(next);

      // sem essa checagem, cada render dos filtros navegaria de novo
      if (params.toString() !== searchParams.toString()) {
        setSearchParams(params, { replace: true });
      }
    },
    [searchParams, setSearchParams],
  );

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSearchNeeds(filters);

  const needs = data?.pages.flatMap((page) => page.needs) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium">Necessidades</h1>
        <p className="text-sm text-muted-foreground">
          O que as ONGs verificadas estão precisando agora.
        </p>
      </header>

      <NeedFiltersBar filters={filters} onChange={handleFiltersChange} />

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-44 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <div
          role="alert"
          className="flex flex-col items-start gap-2 rounded-md bg-destructive-light p-4 text-sm text-destructive"
        >
          Não foi possível carregar as necessidades.
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {data && needs.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="rounded-full bg-muted p-4">
            <SearchX
              className="size-7 text-muted-foreground"
              aria-hidden="true"
            />
          </span>
          <h2 className="font-medium">Nenhuma necessidade encontrada</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Tente outra categoria ou tire algum filtro de localização.
          </p>
        </div>
      )}

      {needs.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {total === 1
              ? "1 necessidade encontrada"
              : `${total} necessidades encontradas`}
          </p>

          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {needs.map((need) => (
              <li key={need.id}>
                <NeedCard need={need} />
              </li>
            ))}
          </ul>

          {hasNextPage && (
            <Button
              variant="outline"
              className="self-center"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "Carregando..." : "Carregar mais"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
