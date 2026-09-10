import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthError } from "@supabase/supabase-js";
import { createElement, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { fetchProfile } from "../services/profiles";
import { PROFILE_QUERY_KEY } from "./useProfile";
import { loginErrorMessage, useLogin } from "./useLogin";

vi.mock("@/lib/supabase", () => ({
  supabase: { auth: { signInWithPassword: vi.fn() } },
}));

vi.mock("../services/profiles", () => ({ fetchProfile: vi.fn() }));

const signInMock = vi.mocked(supabase.auth.signInWithPassword);
const fetchProfileMock = vi.mocked(fetchProfile);

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

const credentials = { email: "ana@exemplo.com", password: "senha-forte-1" };

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
});

describe("loginErrorMessage", () => {
  it("traduz credenciais inválidas", () => {
    expect(
      loginErrorMessage(
        new AuthError("Invalid login credentials", 400, "invalid_credentials"),
      ),
    ).toBe("E-mail ou senha inválidos");
  });

  it("traduz e-mail não confirmado", () => {
    expect(
      loginErrorMessage(
        new AuthError("Email not confirmed", 400, "email_not_confirmed"),
      ),
    ).toBe("Confirme seu e-mail antes de entrar");
  });

  it("cai numa mensagem genérica fora do AuthError", () => {
    expect(loginErrorMessage(new Error("timeout"))).toBe(
      "Não foi possível entrar. Tente novamente.",
    );
  });
});

describe("useLogin", () => {
  it("entra, guarda o perfil no cache e devolve a home do papel", async () => {
    signInMock.mockResolvedValue({
      data: { user: { id: "user-1" }, session: {} },
      error: null,
    } as never);
    fetchProfileMock.mockResolvedValue({
      id: "user-1",
      user_type: "ong",
      name: "Casa Solidária",
      phone: null,
      created_at: "2026-09-10T12:00:00Z",
    });

    const { result } = renderHook(() => useLogin(), { wrapper });

    await expect(result.current.login(credentials)).resolves.toBe("/painel");

    expect(signInMock).toHaveBeenCalledWith(credentials);
    expect(queryClient.getQueryData(PROFILE_QUERY_KEY)).toMatchObject({
      user_type: "ong",
    });
  });

  it("expõe a mensagem tratada quando as credenciais estão erradas", async () => {
    signInMock.mockResolvedValue({
      data: { user: null, session: null },
      error: new AuthError("Invalid login credentials", 400, "invalid_credentials"),
    } as never);

    const { result } = renderHook(() => useLogin(), { wrapper });

    await expect(result.current.login(credentials)).rejects.toThrow();
    await waitFor(() =>
      expect(result.current.error).toBe("E-mail ou senha inválidos"),
    );
  });

  it("manda o doador sem perfil para a busca de necessidades", async () => {
    signInMock.mockResolvedValue({
      data: { user: { id: "user-1" }, session: {} },
      error: null,
    } as never);
    fetchProfileMock.mockResolvedValue(null);

    const { result } = renderHook(() => useLogin(), { wrapper });

    await expect(result.current.login(credentials)).resolves.toBe(
      "/necessidades",
    );
  });
});
