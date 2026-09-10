import { supabase } from "@/lib/supabase";
import { requestPasswordReset, updatePassword } from "./passwordReset";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

const resetPasswordForEmailMock = vi.mocked(
  supabase.auth.resetPasswordForEmail,
);
const updateUserMock = vi.mocked(supabase.auth.updateUser);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requestPasswordReset", () => {
  it("envia o e-mail apontando para /redefinir-senha", async () => {
    resetPasswordForEmailMock.mockResolvedValue({ error: null } as never);

    await requestPasswordReset("ana@exemplo.com");

    expect(resetPasswordForEmailMock).toHaveBeenCalledWith("ana@exemplo.com", {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
  });

  it("propaga o erro", async () => {
    resetPasswordForEmailMock.mockResolvedValue({
      error: new Error("rate limit"),
    } as never);

    await expect(requestPasswordReset("ana@exemplo.com")).rejects.toThrow(
      "rate limit",
    );
  });
});

describe("updatePassword", () => {
  it("atualiza a senha do usuário logado", async () => {
    updateUserMock.mockResolvedValue({ error: null } as never);

    await updatePassword("senha-nova-123");

    expect(updateUserMock).toHaveBeenCalledWith({ password: "senha-nova-123" });
  });

  it("propaga o erro", async () => {
    updateUserMock.mockResolvedValue({
      error: new Error("link expirado"),
    } as never);

    await expect(updatePassword("senha-nova-123")).rejects.toThrow(
      "link expirado",
    );
  });
});
