import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { fetchNeed, fetchOngNeeds, searchNeeds } from "../services/needs";
import type { NeedWithOng, NeedsPage } from "../model/need";
import {
  nextSearchPage,
  useNeed,
  useOngNeeds,
  useSearchNeeds,
} from "./useNeedQueries";

vi.mock("../services/needs");

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return createElement(QueryClientProvider, { client: queryClient }, children);
}

function pageOf(size: number, total: number): NeedsPage {
  return {
    needs: Array.from({ length: size }, (_, index) => ({
      id: `need-${index}`,
    })) as NeedWithOng[],
    total,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("nextSearchPage", () => {
  it("pede a próxima página enquanto faltar resultado", () => {
    const first = pageOf(12, 20);

    expect(nextSearchPage(first, [first])).toBe(1);
  });

  it("para quando tudo já foi carregado", () => {
    const first = pageOf(12, 20);
    const second = pageOf(8, 20);

    expect(nextSearchPage(second, [first, second])).toBeUndefined();
    expect(nextSearchPage(pageOf(0, 0), [pageOf(0, 0)])).toBeUndefined();
  });
});

describe("useSearchNeeds", () => {
  it("busca com os filtros e carrega a página seguinte", async () => {
    vi.mocked(searchNeeds)
      .mockResolvedValueOnce(pageOf(12, 13))
      .mockResolvedValueOnce(pageOf(1, 13));

    const filters = { urgency: "high" as const };
    const { result } = renderHook(() => useSearchNeeds(filters), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(searchNeeds).toHaveBeenCalledWith(filters, 0);
    expect(result.current.hasNextPage).toBe(true);

    await act(() => result.current.fetchNextPage());

    expect(searchNeeds).toHaveBeenLastCalledWith(filters, 1);
    await waitFor(() => expect(result.current.hasNextPage).toBe(false));
  });
});

describe("useNeed", () => {
  it("busca pelo id", async () => {
    vi.mocked(fetchNeed).mockResolvedValue({ id: "need-1" } as NeedWithOng);

    const { result } = renderHook(() => useNeed("need-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchNeed).toHaveBeenCalledWith("need-1");
  });

  it("não busca sem id", () => {
    const { result } = renderHook(() => useNeed(""), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchNeed).not.toHaveBeenCalled();
  });
});

describe("useOngNeeds", () => {
  it("espera o id da ONG", () => {
    const { result } = renderHook(() => useOngNeeds(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchOngNeeds).not.toHaveBeenCalled();
  });

  it("lista as necessidades da ONG", async () => {
    vi.mocked(fetchOngNeeds).mockResolvedValue([]);

    const { result } = renderHook(() => useOngNeeds("ong-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchOngNeeds).toHaveBeenCalledWith("ong-1");
  });
});
