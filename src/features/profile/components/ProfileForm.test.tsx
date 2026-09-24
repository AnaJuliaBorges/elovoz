import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import type { Profile } from "@/features/auth";
import { useUpdateProfile } from "../hooks/useAccount";
import { ProfileForm } from "./ProfileForm";

vi.mock("../hooks/useAccount");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

type MutateOptions = {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

const profile: Profile = {
  id: "user-1",
  user_type: "donor",
  name: "Ana Souza",
  phone: "21998765432",
  created_at: "2026-09-10T12:00:00Z",
};

function setup(overrides: Partial<Profile> = {}) {
  const mutate = vi.fn();
  vi.mocked(useUpdateProfile).mockReturnValue({
    mutate,
    isPending: false,
  } as never);

  render(
    <ProfileForm profile={{ ...profile, ...overrides }} email="ana@teste.com" />,
  );

  return { mutate };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ProfileForm", () => {
  it("abre com os dados salvos e o e-mail só para leitura", () => {
    setup();

    expect(screen.getByLabelText("Nome completo")).toHaveValue("Ana Souza");
    expect(screen.getByLabelText("Telefone (opcional)")).toHaveValue(
      "(21) 99876-5432",
    );
    expect(screen.getByLabelText("E-mail")).toHaveValue("ana@teste.com");
    expect(screen.getByLabelText("E-mail")).toBeDisabled();
  });

  it("só libera salvar depois de mudar alguma coisa", async () => {
    setup();
    const user = userEvent.setup();
    const save = screen.getByRole("button", { name: "Salvar alterações" });

    expect(save).toBeDisabled();

    await user.type(screen.getByLabelText("Nome completo"), " Lima");

    expect(save).toBeEnabled();
  });

  it("salva os dados e avisa", async () => {
    const { mutate } = setup({ phone: null });
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Telefone (opcional)"), "21912345678");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(mutate).toHaveBeenCalledWith(
      { name: "Ana Souza", phone: "(21) 91234-5678" },
      expect.anything(),
    );

    const [, options] = mutate.mock.calls[0] as [unknown, MutateOptions];
    options.onSuccess?.();
    expect(toast.success).toHaveBeenCalledWith("Dados atualizados");

    options.onError?.(new Error("RLS"));
    expect(toast.error).toHaveBeenCalled();
  });

  it("não salva com nome curto", async () => {
    const { mutate } = setup();
    const user = userEvent.setup();

    await user.clear(screen.getByLabelText("Nome completo"));
    await user.type(screen.getByLabelText("Nome completo"), "A");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(
      await screen.findByText("Informe o nome completo"),
    ).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("chama o nome de responsável na conta de ONG", () => {
    setup({ user_type: "ong" });

    expect(screen.getByLabelText("Nome do responsável")).toBeInTheDocument();
  });
});
