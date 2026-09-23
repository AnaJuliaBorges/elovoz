import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { useProfile } from "@/features/auth";
import { useIsFollowingOng, useToggleFollowOng } from "../hooks/useFollowOng";
import { FollowOngButton } from "./FollowOngButton";

vi.mock("@/features/auth");
vi.mock("../hooks/useFollowOng");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

type MutateOptions = {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

function setup({
  userType = "donor" as "donor" | "ong" | "admin",
  isFollowing = false,
  isLoading = false,
  isPending = false,
} = {}) {
  vi.mocked(useProfile).mockReturnValue({
    data: { user_type: userType },
  } as never);
  vi.mocked(useIsFollowingOng).mockReturnValue({
    data: isFollowing,
    isLoading,
  } as never);

  const mutate = vi.fn();
  vi.mocked(useToggleFollowOng).mockReturnValue({ mutate, isPending } as never);

  render(<FollowOngButton ongId="ong-1" />);

  return { mutate };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("FollowOngButton", () => {
  it("segue a ONG e avisa o doador", async () => {
    const { mutate } = setup();
    const user = userEvent.setup();

    const button = screen.getByRole("button", { name: "Seguir" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(useIsFollowingOng).toHaveBeenCalledWith("ong-1", { enabled: true });

    await user.click(button);

    expect(mutate).toHaveBeenCalledWith(false, expect.anything());

    const [, options] = mutate.mock.calls[0] as [boolean, MutateOptions];
    options.onSuccess?.();
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining("Avisaremos"),
    );
  });

  it("deixa de seguir quando já segue", async () => {
    const { mutate } = setup({ isFollowing: true });
    const user = userEvent.setup();

    const button = screen.getByRole("button", { name: "Seguindo" });
    expect(button).toHaveAttribute("aria-pressed", "true");

    await user.click(button);

    expect(mutate).toHaveBeenCalledWith(true, expect.anything());

    const [, options] = mutate.mock.calls[0] as [boolean, MutateOptions];
    options.onSuccess?.();
    expect(toast.success).toHaveBeenCalledWith(
      "Você deixou de seguir esta instituição",
    );
  });

  it("mostra a mensagem certa quando a RLS recusa", async () => {
    const { mutate } = setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Seguir" }));

    const [, options] = mutate.mock.calls[0] as [boolean, MutateOptions];
    options.onError?.({ code: "42501" });

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("conta de doador"),
    );
  });

  it("não aparece para quem não é doador, e nem consulta o seguir", () => {
    setup({ userType: "ong" });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(useIsFollowingOng).toHaveBeenCalledWith("ong-1", { enabled: false });
  });

  it("fica desabilitado enquanto carrega ou grava", () => {
    setup({ isPending: true });

    expect(screen.getByRole("button")).toBeDisabled();
  });
});
