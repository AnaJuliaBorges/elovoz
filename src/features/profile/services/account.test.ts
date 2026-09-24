import { supabase } from "@/lib/supabase";
import { deleteOwnAccount, fetchAccountEmail } from "./account";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
    auth: { getSession: vi.fn(), signOut: vi.fn() },
  },
}));

const rpcMock = vi.mocked(supabase.rpc);
const getSessionMock = vi.mocked(supabase.auth.getSession);
const signOutMock = vi.mocked(supabase.auth.signOut);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchAccountEmail", () => {
  it("devolve o e-mail da sessão", async () => {
    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: "user-1", email: "ana@teste.com" } } },
    } as never);

    await expect(fetchAccountEmail()).resolves.toBe("ana@teste.com");
  });

  it("devolve null sem sessão", async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } } as never);

    await expect(fetchAccountEmail()).resolves.toBeNull();
  });
});

describe("deleteOwnAccount", () => {
  it("chama a função do banco e encerra a sessão local", async () => {
    rpcMock.mockResolvedValue({ data: null, error: null } as never);

    await deleteOwnAccount();

    expect(rpcMock).toHaveBeenCalledWith("delete_own_account");
    expect(signOutMock).toHaveBeenCalledWith({ scope: "local" });
  });

  it("propaga erro e mantém a sessão", async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: new Error("function not found"),
    } as never);

    await expect(deleteOwnAccount()).rejects.toThrow("function not found");
    expect(signOutMock).not.toHaveBeenCalled();
  });
});
