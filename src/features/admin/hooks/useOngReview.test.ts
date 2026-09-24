import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { fetchOngsForReview, setOngVerificationStatus } from "@/features/ongs";
import { useOngsForReview, useSetOngStatus } from "./useOngReview";

vi.mock("@/features/ongs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/ongs")>()),
  fetchOngsForReview: vi.fn(),
  setOngVerificationStatus: vi.fn(),
}));

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
});

describe("useOngsForReview", () => {
  it("busca a fila de ONGs", async () => {
    vi.mocked(fetchOngsForReview).mockResolvedValue([]);
    const { result } = renderHook(() => useOngsForReview(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual([]));
    expect(fetchOngsForReview).toHaveBeenCalled();
  });
});

describe("useSetOngStatus", () => {
  it("grava o status e invalida a fila, as ONGs e as necessidades", async () => {
    vi.mocked(setOngVerificationStatus).mockResolvedValue();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useSetOngStatus(), { wrapper });

    await result.current.mutateAsync({ id: "ong-1", status: "approved" });

    expect(setOngVerificationStatus).toHaveBeenCalledWith("ong-1", "approved");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["admin", "ongs"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["ongs"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["needs"] });
  });

  it("não invalida quando a gravação falha", async () => {
    vi.mocked(setOngVerificationStatus).mockRejectedValue(new Error("RLS"));
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useSetOngStatus(), { wrapper });

    await expect(
      result.current.mutateAsync({ id: "ong-1", status: "rejected" }),
    ).rejects.toThrow("RLS");
    expect(invalidate).not.toHaveBeenCalled();
  });
});
