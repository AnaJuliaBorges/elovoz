import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import {
  createInterest,
  deleteInterest,
  setInterestAnswered,
} from "../services/interests";
import { emptyInterestForm } from "../model/schema";
import {
  useCreateInterest,
  useDeleteInterest,
  useSetInterestAnswered,
} from "./useInterestMutations";

vi.mock("../services/interests");

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

const values = { ...emptyInterestForm, message: "Tenho 10 cestas para doar" };

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
});

describe("useCreateInterest", () => {
  it("grava e invalida os interesses", async () => {
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateInterest("need-1"), {
      wrapper,
    });

    await result.current.mutateAsync(values);

    expect(createInterest).toHaveBeenCalledWith("need-1", values);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["interests"] });
  });

  it("não invalida quando a RLS recusa", async () => {
    vi.mocked(createInterest).mockRejectedValue({ code: "42501" });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateInterest("need-1"), {
      wrapper,
    });

    await expect(result.current.mutateAsync(values)).rejects.toEqual({
      code: "42501",
    });
    expect(invalidate).not.toHaveBeenCalled();
  });
});

describe("useDeleteInterest", () => {
  it("apaga e invalida", async () => {
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useDeleteInterest(), { wrapper });

    await result.current.mutateAsync("interest-1");

    expect(deleteInterest).toHaveBeenCalledWith("interest-1");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["interests"] });
  });
});

describe("useSetInterestAnswered", () => {
  it("marca e invalida os interesses e as necessidades do painel", async () => {
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useSetInterestAnswered(), {
      wrapper,
    });

    await result.current.mutateAsync({ id: "interest-1", answered: true });

    expect(setInterestAnswered).toHaveBeenCalledWith("interest-1", true);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["interests"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["needs"] });
  });
});
