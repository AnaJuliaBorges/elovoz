import { vi } from "vitest";

export interface QueryResult {
  data?: unknown;
  error?: unknown;
  count?: number | null;
}

/**
 * Mock encadeável do query builder do supabase-js: cada método devolve o
 * próprio builder e o resultado sai tanto de `await builder` quanto de
 * `.single()` / `.maybeSingle()`.
 */
export function createQueryBuilder(result: QueryResult = {}) {
  const value = { data: null, error: null, count: null, ...result };

  const builder = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    ilike: vi.fn(() => builder),
    or: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    range: vi.fn(() => builder),
    single: vi.fn(async () => value),
    maybeSingle: vi.fn(async () => value),
    then: (
      resolve: (value: QueryResult) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(value).then(resolve, reject),
  };

  return builder;
}

export type QueryBuilderMock = ReturnType<typeof createQueryBuilder>;
