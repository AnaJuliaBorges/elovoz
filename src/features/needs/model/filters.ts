import { URGENCIES, type NeedFilters, type Urgency } from "./need";

// os filtros moram na URL: voltar do detalhe para a busca não perde nada
const PARAM_BY_FILTER = {
  categoryId: "categoria",
  urgency: "urgencia",
  stateId: "estado",
  cityId: "cidade",
  neighborhood: "bairro",
} as const satisfies Record<keyof NeedFilters, string>;

export function filtersFromParams(params: URLSearchParams): NeedFilters {
  const urgency = params.get(PARAM_BY_FILTER.urgency);

  return {
    categoryId: params.get(PARAM_BY_FILTER.categoryId) || undefined,
    urgency: URGENCIES.includes(urgency as Urgency)
      ? (urgency as Urgency)
      : undefined,
    stateId: params.get(PARAM_BY_FILTER.stateId) || undefined,
    cityId: params.get(PARAM_BY_FILTER.cityId) || undefined,
    neighborhood: params.get(PARAM_BY_FILTER.neighborhood)?.trim() || undefined,
  };
}

export function filtersToParams(filters: NeedFilters): URLSearchParams {
  const params = new URLSearchParams();

  for (const [filter, param] of Object.entries(PARAM_BY_FILTER)) {
    const value = filters[filter as keyof NeedFilters];

    if (value) params.set(param, value);
  }

  return params;
}
