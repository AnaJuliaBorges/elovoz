import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { deleteUser, fetchAdminUsers } from "../services/users";
import { useAdminUsers, useDeleteUser } from "./useAdminUsers";

vi.mock("../services/users");

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

describe("useAdminUsers", () => {
  it("lista as contas", async () => {
    vi.mocked(fetchAdminUsers).mockResolvedValue([]);
    const { result } = renderHook(() => useAdminUsers(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual([]));
  });
});

describe("useDeleteUser", () => {
  it("exclui e invalida o admin, as ONGs e as necessidades", async () => {
    vi.mocked(deleteUser).mockResolvedValue();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useDeleteUser(), { wrapper });

    await result.current.mutateAsync("u-1");

    expect(deleteUser).toHaveBeenCalledWith("u-1", expect.anything());
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["admin"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["ongs"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["needs"] });
  });

  it("não invalida quando a exclusão falha", async () => {
    vi.mocked(deleteUser).mockRejectedValue(new Error("42501"));
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useDeleteUser(), { wrapper });

    await expect(result.current.mutateAsync("u-1")).rejects.toThrow("42501");
    expect(invalidate).not.toHaveBeenCalled();
  });
});
