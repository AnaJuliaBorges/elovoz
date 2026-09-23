import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import {
  fetchOngOpeningHours,
  saveOngOpeningHours,
} from "../services/ongOpeningHours";
import {
  useOngOpeningHours,
  useSaveOngOpeningHours,
} from "./useOngOpeningHours";

vi.mock("../services/ongOpeningHours");

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

const hours = [{ weekday: 1 as const, opens_at: "09:00", closes_at: "17:00" }];

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
});

describe("useOngOpeningHours", () => {
  it("busca os horários da ONG", async () => {
    vi.mocked(fetchOngOpeningHours).mockResolvedValue(hours);
    const { result } = renderHook(() => useOngOpeningHours("ong-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toEqual(hours));
    expect(fetchOngOpeningHours).toHaveBeenCalledWith("ong-1");
  });

  it("não busca enquanto a ONG não carregou", () => {
    renderHook(() => useOngOpeningHours(undefined), { wrapper });

    expect(fetchOngOpeningHours).not.toHaveBeenCalled();
  });
});

describe("useSaveOngOpeningHours", () => {
  it("salva e invalida o que mostra horário", async () => {
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useSaveOngOpeningHours("ong-1"), {
      wrapper,
    });

    await result.current.mutateAsync(hours);

    expect(saveOngOpeningHours).toHaveBeenCalledWith("ong-1", hours);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["ongs"] });
  });

  it("não invalida quando falha", async () => {
    vi.mocked(saveOngOpeningHours).mockRejectedValue(new Error("RLS"));
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useSaveOngOpeningHours("ong-1"), {
      wrapper,
    });

    await expect(result.current.mutateAsync(hours)).rejects.toThrow("RLS");
    expect(invalidate).not.toHaveBeenCalled();
  });
});
