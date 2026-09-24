import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import {
  fetchFollowedOngs,
  fetchIsFollowingOng,
  followOng,
  unfollowOng,
} from "../services/ongFollowers";
import {
  useFollowedOngs,
  useIsFollowingOng,
  useToggleFollowOng,
} from "./useFollowOng";

vi.mock("../services/ongFollowers");

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

describe("useIsFollowingOng", () => {
  it("consulta o seguir da ONG", async () => {
    vi.mocked(fetchIsFollowingOng).mockResolvedValue(true);
    const { result } = renderHook(() => useIsFollowingOng("ong-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toBe(true));
    expect(fetchIsFollowingOng).toHaveBeenCalledWith("ong-1");
  });

  it("não consulta quando o visitante não é doador", () => {
    renderHook(() => useIsFollowingOng("ong-1", { enabled: false }), {
      wrapper,
    });

    expect(fetchIsFollowingOng).not.toHaveBeenCalled();
  });

  it("não consulta sem id na URL", () => {
    renderHook(() => useIsFollowingOng(""), { wrapper });

    expect(fetchIsFollowingOng).not.toHaveBeenCalled();
  });
});

describe("useFollowedOngs", () => {
  it("lista as ONGs seguidas", async () => {
    vi.mocked(fetchFollowedOngs).mockResolvedValue([]);
    const { result } = renderHook(() => useFollowedOngs(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual([]));
    expect(fetchFollowedOngs).toHaveBeenCalled();
  });

  it("não consulta quando desligado", () => {
    renderHook(() => useFollowedOngs({ enabled: false }), { wrapper });

    expect(fetchFollowedOngs).not.toHaveBeenCalled();
  });
});

describe("useToggleFollowOng", () => {
  it("segue quando ainda não segue, e invalida o estado", async () => {
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useToggleFollowOng("ong-1"), {
      wrapper,
    });

    await result.current.mutateAsync(false);

    expect(followOng).toHaveBeenCalledWith("ong-1");
    expect(unfollowOng).not.toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["ongs", "following", "ong-1"],
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["ongs", "followed"],
    });
  });

  it("deixa de seguir quando já segue", async () => {
    const { result } = renderHook(() => useToggleFollowOng("ong-1"), {
      wrapper,
    });

    await result.current.mutateAsync(true);

    expect(unfollowOng).toHaveBeenCalledWith("ong-1");
    expect(followOng).not.toHaveBeenCalled();
  });

  it("não invalida quando a gravação falha", async () => {
    vi.mocked(followOng).mockRejectedValue({ code: "42501" });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useToggleFollowOng("ong-1"), {
      wrapper,
    });

    await expect(result.current.mutateAsync(false)).rejects.toEqual({
      code: "42501",
    });
    expect(invalidate).not.toHaveBeenCalled();
  });
});
