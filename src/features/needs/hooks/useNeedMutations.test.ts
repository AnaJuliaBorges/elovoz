import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import {
  createNeed,
  deleteNeed,
  updateNeed,
  updateNeedStatus,
} from "../services/needs";
import { emptyNeedForm } from "../model/schema";
import {
  useCreateNeed,
  useDeleteNeed,
  useUpdateNeed,
  useUpdateNeedStatus,
} from "./useNeedMutations";

vi.mock("../services/needs");

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

const values = { ...emptyNeedForm, title: "Cestas", category_id: "cat-1" };

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
});

function spyInvalidate() {
  return vi.spyOn(queryClient, "invalidateQueries");
}

describe("useCreateNeed", () => {
  it("cria e invalida as listas de necessidades", async () => {
    const invalidate = spyInvalidate();
    const { result } = renderHook(() => useCreateNeed(), { wrapper });

    await result.current.mutateAsync({ ongId: "ong-1", values });

    expect(createNeed).toHaveBeenCalledWith("ong-1", values);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["needs"] });
  });

  it("não invalida quando falha", async () => {
    vi.mocked(createNeed).mockRejectedValue({ code: "42501" });
    const invalidate = spyInvalidate();
    const { result } = renderHook(() => useCreateNeed(), { wrapper });

    await expect(
      result.current.mutateAsync({ ongId: "ong-1", values }),
    ).rejects.toEqual({ code: "42501" });
    expect(invalidate).not.toHaveBeenCalled();
  });
});

describe("useUpdateNeed", () => {
  it("atualiza e invalida", async () => {
    const invalidate = spyInvalidate();
    const { result } = renderHook(() => useUpdateNeed(), { wrapper });

    await result.current.mutateAsync({ id: "need-1", values });

    expect(updateNeed).toHaveBeenCalledWith("need-1", values);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["needs"] });
  });
});

describe("useUpdateNeedStatus", () => {
  it("muda o status e invalida", async () => {
    const invalidate = spyInvalidate();
    const { result } = renderHook(() => useUpdateNeedStatus(), { wrapper });

    await result.current.mutateAsync({ id: "need-1", status: "fulfilled" });

    expect(updateNeedStatus).toHaveBeenCalledWith("need-1", "fulfilled");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["needs"] });
  });
});

describe("useDeleteNeed", () => {
  it("exclui e invalida", async () => {
    const invalidate = spyInvalidate();
    const { result } = renderHook(() => useDeleteNeed(), { wrapper });

    await result.current.mutateAsync("need-1");

    expect(deleteNeed).toHaveBeenCalledWith("need-1");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["needs"] });
  });
});
