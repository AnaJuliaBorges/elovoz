import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { toast } from "sonner";
import { useMyOng } from "../hooks/useMyOng";
import {
  useOngOpeningHours,
  useSaveOngOpeningHours,
} from "../hooks/useOngOpeningHours";
import OngHoursPage from "./OngHoursPage";

vi.mock("../hooks/useMyOng");
vi.mock("../hooks/useOngOpeningHours");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

type MutateOptions = {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

function setup({
  ong = { id: "ong-1", trade_name: "Casa", verification_status: "approved" },
  hours = [
    { weekday: 1 as const, opens_at: "09:00:00", closes_at: "17:00:00" },
  ],
  loadingOng = false,
  loadingHours = false,
  isError = false,
}: Record<string, unknown> = {}) {
  vi.mocked(useMyOng).mockReturnValue({
    data: ong,
    isLoading: loadingOng,
  } as never);

  const refetch = vi.fn();
  vi.mocked(useOngOpeningHours).mockReturnValue({
    data: hours,
    isLoading: loadingHours,
    isError,
    refetch,
  } as never);

  const mutate = vi.fn();
  vi.mocked(useSaveOngOpeningHours).mockReturnValue({
    mutate,
    isPending: false,
  } as never);

  render(
    <MemoryRouter>
      <OngHoursPage />
    </MemoryRouter>,
  );

  return { mutate, refetch };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("OngHoursPage", () => {
  it("abre já com os horários salvos", () => {
    setup();

    expect(screen.getByRole("checkbox", { name: "Segunda" })).toBeChecked();
    expect(screen.getByLabelText("Segunda: abre às")).toHaveValue("09:00");
    expect(screen.getByLabelText("Segunda: fecha às")).toHaveValue("17:00");
  });

  it("salva só os dias abertos", async () => {
    const { mutate } = setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole("checkbox", { name: "Sábado" }));
    await user.type(screen.getByLabelText("Sábado: abre às"), "08:00");
    await user.type(screen.getByLabelText("Sábado: fecha às"), "12:00");
    await user.click(screen.getByRole("button", { name: "Salvar horários" }));

    expect(mutate).toHaveBeenCalledWith(
      [
        { weekday: 1, opens_at: "09:00", closes_at: "17:00" },
        { weekday: 6, opens_at: "08:00", closes_at: "12:00" },
      ],
      expect.anything(),
    );

    const [, options] = mutate.mock.calls[0] as [unknown, MutateOptions];
    options.onSuccess?.();
    expect(toast.success).toHaveBeenCalledWith("Horários atualizados");
  });

  it("não salva com horário incompleto", async () => {
    const { mutate } = setup({ hours: [] });
    const user = userEvent.setup();

    await user.click(screen.getByRole("checkbox", { name: "Terça" }));
    await user.click(screen.getByRole("button", { name: "Salvar horários" }));

    expect(
      await screen.findByText(/abertura e de fechamento/),
    ).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("avisa quando salvar falha", async () => {
    const { mutate } = setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Salvar horários" }));

    const [, options] = mutate.mock.calls[0] as [unknown, MutateOptions];
    options.onError?.(new Error("RLS"));

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("Não foi possível salvar"),
    );
  });

  it("não monta o formulário enquanto carrega", () => {
    setup({ loadingHours: true });

    expect(
      screen.queryByRole("button", { name: "Salvar horários" }),
    ).not.toBeInTheDocument();
  });

  it("deixa tentar de novo quando a busca falha", async () => {
    const { refetch } = setup({ isError: true, hours: undefined });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(refetch).toHaveBeenCalled();
  });

  it("explica quando a conta não tem ONG", () => {
    setup({ ong: null, hours: undefined });

    expect(
      screen.getByText(/Não encontramos os dados da sua instituição/),
    ).toBeInTheDocument();
  });
});
