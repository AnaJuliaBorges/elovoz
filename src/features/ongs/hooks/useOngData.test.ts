import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import {
  fetchOngForEdit,
  updateOngContact,
  updateOngIdentity,
} from "../services/ongs";
import {
  useOngForEdit,
  useUpdateOngContact,
  useUpdateOngIdentity,
} from "./useOngData";

vi.mock("../services/ongs");

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

describe("useOngForEdit", () => {
  it("busca a ONG pelo id", async () => {
    vi.mocked(fetchOngForEdit).mockResolvedValue(null);
    const { result } = renderHook(() => useOngForEdit("ong-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchOngForEdit).toHaveBeenCalledWith("ong-1");
  });

  it("espera o id da ONG", () => {
    renderHook(() => useOngForEdit(undefined), { wrapper });

    expect(fetchOngForEdit).not.toHaveBeenCalled();
  });
});

describe("useUpdateOngIdentity", () => {
  it("salva e invalida ONGs, a ONG do painel e as necessidades", async () => {
    vi.mocked(updateOngIdentity).mockResolvedValue();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateOngIdentity("ong-1"), {
      wrapper,
    });
    const values = { trade_name: "Casa", mission: "Missão da casa" };

    await result.current.mutateAsync(values);

    expect(updateOngIdentity).toHaveBeenCalledWith("ong-1", values);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["ongs"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["my-ong"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["needs"] });
  });
});

describe("useUpdateOngContact", () => {
  it("salva e invalida", async () => {
    vi.mocked(updateOngContact).mockResolvedValue();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateOngContact("ong-1"), {
      wrapper,
    });
    const values = {
      state_id: "uf-rj",
      city_id: "rio",
      neighborhood: "Centro",
      address: "Rua das Flores, 10",
      contacts: [{ number: "(21) 99876-5432", whatsapp: true }],
    };

    await result.current.mutateAsync(values);

    expect(updateOngContact).toHaveBeenCalledWith("ong-1", values);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["ongs"] });
  });

  it("não invalida quando a gravação falha", async () => {
    vi.mocked(updateOngContact).mockRejectedValue(new Error("RLS"));
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateOngContact("ong-1"), {
      wrapper,
    });

    await expect(
      result.current.mutateAsync({
        state_id: "",
        city_id: "",
        neighborhood: "",
        address: "",
        contacts: [],
      }),
    ).rejects.toThrow("RLS");
    expect(invalidate).not.toHaveBeenCalled();
  });
});
