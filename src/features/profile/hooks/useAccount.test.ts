import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { updateProfile } from "@/features/auth";
import { deleteOwnAccount, fetchAccountEmail } from "../services/account";
import {
  useAccountEmail,
  useDeleteAccount,
  useUpdateProfile,
} from "./useAccount";

vi.mock("../services/account");
vi.mock("@/features/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/auth")>()),
  updateProfile: vi.fn(),
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

describe("useAccountEmail", () => {
  it("busca o e-mail da sessão", async () => {
    vi.mocked(fetchAccountEmail).mockResolvedValue("ana@teste.com");
    const { result } = renderHook(() => useAccountEmail(), { wrapper });

    await waitFor(() => expect(result.current.data).toBe("ana@teste.com"));
  });
});

describe("useUpdateProfile", () => {
  it("salva e invalida o perfil", async () => {
    vi.mocked(updateProfile).mockResolvedValue();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateProfile("user-1"), {
      wrapper,
    });

    await result.current.mutateAsync({ name: "Ana", phone: "" });

    expect(updateProfile).toHaveBeenCalledWith("user-1", {
      name: "Ana",
      phone: "",
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["profile"] });
  });
});

describe("useDeleteAccount", () => {
  it("apaga a conta e limpa o cache", async () => {
    vi.mocked(deleteOwnAccount).mockResolvedValue();
    const clear = vi.spyOn(queryClient, "clear");
    const { result } = renderHook(() => useDeleteAccount(), { wrapper });

    await result.current.mutateAsync();

    expect(deleteOwnAccount).toHaveBeenCalled();
    expect(clear).toHaveBeenCalled();
  });

  it("não limpa o cache quando falha", async () => {
    vi.mocked(deleteOwnAccount).mockRejectedValue(new Error("rpc"));
    const clear = vi.spyOn(queryClient, "clear");
    const { result } = renderHook(() => useDeleteAccount(), { wrapper });

    await expect(result.current.mutateAsync()).rejects.toThrow("rpc");
    expect(clear).not.toHaveBeenCalled();
  });
});
