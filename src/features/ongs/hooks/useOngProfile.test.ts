import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { fetchOngProfile } from "../services/ongs";
import { useOngProfile } from "./useOngProfile";

vi.mock("../services/ongs");

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

describe("useOngProfile", () => {
  it("busca o perfil pelo id da rota", async () => {
    vi.mocked(fetchOngProfile).mockResolvedValue(null);
    const { result } = renderHook(() => useOngProfile("ong-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchOngProfile).toHaveBeenCalledWith("ong-1");
  });

  it("não busca sem id", () => {
    renderHook(() => useOngProfile(""), { wrapper });

    expect(fetchOngProfile).not.toHaveBeenCalled();
  });
});
