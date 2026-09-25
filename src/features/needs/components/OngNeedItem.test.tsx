import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { toast } from "sonner";
import { useDeleteNeed, useUpdateNeedStatus } from "../hooks/useNeedMutations";
import type { NeedWithInterestCount } from "../model/need";
import { OngNeedItem } from "./OngNeedItem";

vi.mock("../hooks/useNeedMutations");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const need: NeedWithInterestCount = {
  id: "need-1",
  ong_id: "ong-1",
  category_id: "cat-1",
  title: "Cestas básicas",
  description: null,
  quantity: 30,
  urgency: "high",
  deadline: "2026-10-01",
  status: "open",
  created_at: "2026-09-10T12:00:00Z",
  updated_at: "2026-09-10T12:00:00Z",
  category: { id: "cat-1", name: "Alimentos" },
  interest_count: 0,
  answered_count: 0,
};

type MutateOptions = { onSuccess?: () => void; onError?: (error: unknown) => void };

function mockMutations({
  statusPending = false,
  statusVariables,
}: {
  statusPending?: boolean;
  statusVariables?: { id: string; status: string };
} = {}) {
  const updateMutate = vi.fn();
  const deleteMutate = vi.fn();

  vi.mocked(useUpdateNeedStatus).mockReturnValue({
    mutate: updateMutate,
    isPending: statusPending,
    variables: statusVariables,
  } as never);
  vi.mocked(useDeleteNeed).mockReturnValue({
    mutate: deleteMutate,
    isPending: false,
  } as never);

  return { updateMutate, deleteMutate };
}

function renderItem(overrides: Partial<NeedWithInterestCount> = {}) {
  return render(
    <MemoryRouter>
      <OngNeedItem need={{ ...need, ...overrides }} />
    </MemoryRouter>,
  );
}

beforeAll(() => {
  // o Radix Select usa APIs de ponteiro que o jsdom não implementa
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("OngNeedItem", () => {
  it("mostra categoria, quantidade, prazo e o link de edição", () => {
    mockMutations();
    renderItem();

    expect(
      screen.getByText("Alimentos · Quantidade: 30 · Até 01/10/2026"),
    ).toBeInTheDocument();
    expect(screen.getByText("Urgência alta")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Editar/ })).toHaveAttribute(
      "href",
      "/painel/necessidades/need-1/editar",
    );
  });

  it("muda o status e avisa quando salvou", async () => {
    const { updateMutate } = mockMutations();
    updateMutate.mockImplementation((_variables, options: MutateOptions) =>
      options.onSuccess?.(),
    );
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderItem();

    await user.click(screen.getByRole("combobox", { name: "Status" }));
    await user.click(await screen.findByRole("option", { name: "Atendida" }));

    expect(updateMutate).toHaveBeenCalledWith(
      { id: "need-1", status: "fulfilled" },
      expect.any(Object),
    );
    expect(toast.success).toHaveBeenCalledWith("Status atualizado");
  });

  it("mostra o erro quando o status não salva", async () => {
    const { updateMutate } = mockMutations();
    updateMutate.mockImplementation((_variables, options: MutateOptions) =>
      options.onError?.(new Error("timeout")),
    );
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderItem();

    await user.click(screen.getByRole("combobox", { name: "Status" }));
    await user.click(
      await screen.findByRole("option", { name: "Parcialmente atendida" }),
    );

    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível atualizar o status.",
    );
  });

  it("mostra o status escolhido enquanto salva", () => {
    mockMutations({
      statusPending: true,
      statusVariables: { id: "need-1", status: "fulfilled" },
    });
    renderItem();

    const trigger = screen.getByRole("combobox", { name: "Status" });

    expect(trigger).toHaveTextContent("Atendida");
    expect(trigger).toBeDisabled();
  });

  it("só exclui depois de confirmar", async () => {
    const { deleteMutate } = mockMutations();
    deleteMutate.mockImplementation((_id, options: MutateOptions) =>
      options.onSuccess?.(),
    );
    const user = userEvent.setup();
    renderItem();

    await user.click(screen.getByRole("button", { name: "Excluir" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("Cestas básicas");
    expect(deleteMutate).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Excluir" }));

    expect(deleteMutate).toHaveBeenCalledWith("need-1", expect.any(Object));
    expect(toast.success).toHaveBeenCalledWith("Necessidade excluída");
  });

  it("não exclui ao cancelar", async () => {
    const { deleteMutate } = mockMutations();
    const user = userEvent.setup();
    renderItem();

    await user.click(screen.getByRole("button", { name: "Excluir" }));
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Cancelar",
      }),
    );

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(deleteMutate).not.toHaveBeenCalled();
  });

  it("separa os interesses sem resposta dos respondidos", () => {
    mockMutations();
    renderItem({ interest_count: 3, answered_count: 1 });

    // uma cópia por layout (celular e desktop); o CSS mostra só uma
    const groups = screen.getAllByRole("group", { name: "Interesses recebidos" });
    expect(groups).toHaveLength(2);
    expect(groups[0]).toHaveClass("md:hidden");
    expect(groups[1]).toHaveClass("hidden", "md:flex");

    const [mobile] = groups;
    expect(
      within(mobile).getByRole("link", { name: "2 sem resposta" }),
    ).toHaveAttribute("href", "/necessidades/need-1");
    expect(
      within(mobile).getByRole("link", { name: "1 respondido" }),
    ).toHaveAttribute("href", "/necessidades/need-1");
  });

  it("com tudo respondido, mostra só os respondidos", () => {
    mockMutations();
    renderItem({ interest_count: 2, answered_count: 2 });

    const [mobile] = screen.getAllByRole("group", {
      name: "Interesses recebidos",
    });
    expect(within(mobile).getByText("2 respondidos")).toBeInTheDocument();
    expect(within(mobile).queryByText(/sem resposta/)).not.toBeInTheDocument();
  });

  it("não mostra tags sem interesses", () => {
    mockMutations();
    renderItem();

    expect(
      screen.queryByRole("group", { name: "Interesses recebidos" }),
    ).not.toBeInTheDocument();
  });
});
