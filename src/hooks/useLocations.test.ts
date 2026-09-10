import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { createQueryBuilder } from "@/test/supabaseQueryBuilder";
import { useCities, useStates } from "./useLocations";

vi.mock("@/lib/supabase", () => ({ supabase: { from: vi.fn() } }));

const fromMock = vi.mocked(supabase.from);

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return createElement(QueryClientProvider, { client: queryClient }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useStates", () => {
  it("lista os estados ordenados por nome", async () => {
    const builder = createQueryBuilder({
      data: [{ id: "uuid-rj", name: "Rio de Janeiro", uf: "RJ" }],
    });
    fromMock.mockReturnValue(builder as never);

    const { result } = renderHook(() => useStates(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fromMock).toHaveBeenCalledWith("states");
    expect(builder.select).toHaveBeenCalledWith("id, name, uf");
    expect(builder.order).toHaveBeenCalledWith("name");
    expect(result.current.data).toEqual([
      { id: "uuid-rj", name: "Rio de Janeiro", uf: "RJ" },
    ]);
  });

  it("propaga erro do supabase", async () => {
    fromMock.mockReturnValue(
      createQueryBuilder({ error: new Error("sem conexão") }) as never,
    );

    const { result } = renderHook(() => useStates(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useCities", () => {
  it("não busca enquanto não há estado escolhido", () => {
    const { result } = renderHook(() => useCities(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("filtra as cidades pelo estado escolhido", async () => {
    const builder = createQueryBuilder({
      data: [{ id: "uuid-rio", name: "Rio de Janeiro", state_id: "uuid-rj" }],
    });
    fromMock.mockReturnValue(builder as never);

    const { result } = renderHook(() => useCities("uuid-rj"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fromMock).toHaveBeenCalledWith("cities");
    expect(builder.eq).toHaveBeenCalledWith("state_id", "uuid-rj");
  });
});
