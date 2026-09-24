import { supabase } from "@/lib/supabase";
import { deleteUser, fetchAdminUsers } from "./users";

vi.mock("@/lib/supabase", () => ({
  supabase: { rpc: vi.fn() },
}));

const rpcMock = vi.mocked(supabase.rpc);

function rpcResult(data: unknown = null, error: unknown = null) {
  return { data, error } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchAdminUsers", () => {
  it("lista as contas pela função do banco", async () => {
    const rows = [{ id: "u-1", email: "ana@teste.com" }];
    rpcMock.mockResolvedValue(rpcResult(rows));

    await expect(fetchAdminUsers()).resolves.toEqual(rows);
    expect(rpcMock).toHaveBeenCalledWith("admin_list_users");
  });

  it("devolve lista vazia sem linhas", async () => {
    rpcMock.mockResolvedValue(rpcResult(null));

    await expect(fetchAdminUsers()).resolves.toEqual([]);
  });

  it("propaga erro do supabase", async () => {
    rpcMock.mockResolvedValue(rpcResult(null, new Error("rpc")));

    await expect(fetchAdminUsers()).rejects.toThrow("rpc");
  });
});

describe("deleteUser", () => {
  it("exclui pelo id", async () => {
    rpcMock.mockResolvedValue(rpcResult());

    await deleteUser("u-1");

    expect(rpcMock).toHaveBeenCalledWith("admin_delete_user", {
      p_user_id: "u-1",
    });
  });

  it("propaga a recusa da função", async () => {
    rpcMock.mockResolvedValue(rpcResult(null, { code: "42501" }));

    await expect(deleteUser("u-1")).rejects.toEqual({ code: "42501" });
  });
});
