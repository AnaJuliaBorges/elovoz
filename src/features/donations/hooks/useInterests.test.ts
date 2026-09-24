import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import {
  fetchMyInterest,
  fetchMyInterests,
  fetchNeedInterests,
} from "../services/interests";
import {
  useMyInterest,
  useMyInterests,
  useNeedInterests,
} from "./useInterests";

vi.mock("../services/interests");

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
});

describe("useMyInterest", () => {
  it("busca o interesse da necessidade", async () => {
    vi.mocked(fetchMyInterest).mockResolvedValue(null);
    const { result } = renderHook(() => useMyInterest("need-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchMyInterest).toHaveBeenCalledWith("need-1");
  });

  it("não busca para quem não é doador", () => {
    renderHook(() => useMyInterest("need-1", { enabled: false }), { wrapper });

    expect(fetchMyInterest).not.toHaveBeenCalled();
  });
});

describe("useNeedInterests", () => {
  it("busca os interesses recebidos", async () => {
    vi.mocked(fetchNeedInterests).mockResolvedValue([]);
    const { result } = renderHook(() => useNeedInterests("need-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchNeedInterests).toHaveBeenCalledWith("need-1");
  });

  it("não busca sem id", () => {
    renderHook(() => useNeedInterests(""), { wrapper });

    expect(fetchNeedInterests).not.toHaveBeenCalled();
  });
});

describe("useMyInterests", () => {
  it("lista o histórico do doador", async () => {
    vi.mocked(fetchMyInterests).mockResolvedValue([]);
    const { result } = renderHook(() => useMyInterests(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual([]));
    expect(fetchMyInterests).toHaveBeenCalled();
  });
});
