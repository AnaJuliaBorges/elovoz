import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { toast } from "sonner";
import type { UserType } from "@/features/auth";
import { useDeleteAccount } from "../hooks/useAccount";
import { DeleteAccountSection } from "./DeleteAccountSection";

vi.mock("../hooks/useAccount");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

type MutateOptions = {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

function setup(userType: UserType = "donor") {
  const mutate = vi.fn();
  vi.mocked(useDeleteAccount).mockReturnValue({
    mutate,
    isPending: false,
  } as never);

  render(
    <MemoryRouter initialEntries={["/perfil"]}>
      <Routes>
        <Route
          path="/perfil"
          element={<DeleteAccountSection userType={userType} />}
        />
        <Route path="/" element={<p>página inicial</p>} />
      </Routes>
    </MemoryRouter>,
  );

  return { mutate };
}

async function confirmDeletion() {
  const user = userEvent.setup();

  await user.click(screen.getByRole("button", { name: "Excluir minha conta" }));
  await user.click(screen.getByRole("button", { name: "Excluir conta" }));
}

beforeAll(() => {
  // o AlertDialog do Radix usa APIs de ponteiro que o jsdom não implementa
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DeleteAccountSection", () => {
  it("pede confirmação antes de excluir", async () => {
    const { mutate } = setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Excluir minha conta" }));

    expect(
      screen.getByRole("alertdialog", { name: "Excluir sua conta?" }),
    ).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Excluir conta" }));

    expect(mutate).toHaveBeenCalled();
  });

  it("volta para a página inicial depois de excluir", async () => {
    const { mutate } = setup();
    await confirmDeletion();

    const [, options] = mutate.mock.calls[0] as [unknown, MutateOptions];
    options.onSuccess?.();

    expect(toast.success).toHaveBeenCalledWith("Sua conta foi excluída");
    expect(await screen.findByText("página inicial")).toBeInTheDocument();
  });

  it("avisa quando a exclusão falha", async () => {
    const { mutate } = setup();
    await confirmDeletion();

    const [, options] = mutate.mock.calls[0] as [unknown, MutateOptions];
    options.onError?.(new Error("rpc"));

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("Não foi possível excluir"),
    );
  });

  it("explica à ONG que a instituição também é apagada", () => {
    setup("ong");

    expect(
      screen.getByText(/o cadastro da instituição e todas as necessidades/),
    ).toBeInTheDocument();
  });

  it("não oferece exclusão para admin", () => {
    setup("admin");

    expect(
      screen.queryByRole("button", { name: "Excluir minha conta" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/removidas direto no Supabase/)).toBeInTheDocument();
  });
});
