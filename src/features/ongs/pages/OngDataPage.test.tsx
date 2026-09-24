import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { toast } from "sonner";
import { useMyOng } from "../hooks/useMyOng";
import {
  useOngForEdit,
  useUpdateOngContact,
  useUpdateOngIdentity,
} from "../hooks/useOngData";
import type { OngEditable } from "../model/ong";
import OngDataPage from "./OngDataPage";

vi.mock("../hooks/useMyOng");
vi.mock("../hooks/useOngData");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
// o formulário de endereço tem testes próprios (Select do Radix no jsdom)
vi.mock("../components/OngContactForm", () => ({
  OngContactForm: ({
    onSubmit,
    submitLabel,
  }: {
    onSubmit: (values: unknown) => void;
    submitLabel: string;
  }) => (
    <button type="button" onClick={() => onSubmit({ neighborhood: "Lapa" })}>
      {submitLabel}
    </button>
  ),
}));

type MutateOptions = {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

const ong: OngEditable = {
  id: "ong-1",
  trade_name: "Casa Solidária",
  legal_name: "Associação Casa Solidária",
  cnpj: "11222333000181",
  mission: "Distribuir alimentos para famílias em situação de rua.",
  state_id: "uf-rj",
  city_id: "rio",
  neighborhood: "Centro",
  address: "Rua das Flores, 100",
  instagram: null,
  facebook: null,
  website: null,
  contacts: [],
};

function setup({
  myOng = { id: "ong-1" } as { id: string } | null,
  data = ong as OngEditable | null,
  isLoading = false,
  isError = false,
} = {}) {
  vi.mocked(useMyOng).mockReturnValue({
    data: myOng,
    isLoading: false,
  } as never);

  const refetch = vi.fn();
  vi.mocked(useOngForEdit).mockReturnValue({
    data,
    isLoading,
    isError,
    refetch,
  } as never);

  const identity = vi.fn();
  vi.mocked(useUpdateOngIdentity).mockReturnValue({
    mutate: identity,
    isPending: false,
  } as never);

  const contact = vi.fn();
  vi.mocked(useUpdateOngContact).mockReturnValue({
    mutate: contact,
    isPending: false,
  } as never);

  render(
    <MemoryRouter>
      <OngDataPage />
    </MemoryRouter>,
  );

  return { identity, contact, refetch };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("OngDataPage", () => {
  it("salva a identificação e avisa", async () => {
    const { identity } = setup();
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: "Salvar identificação" }),
    );

    expect(identity).toHaveBeenCalledWith(
      { trade_name: ong.trade_name, mission: ong.mission },
      expect.anything(),
    );

    const [, options] = identity.mock.calls[0] as [unknown, MutateOptions];
    options.onSuccess?.();
    expect(toast.success).toHaveBeenCalledWith("Identificação atualizada");
  });

  it("salva endereço e contatos e avisa quando falha", async () => {
    const { contact } = setup();
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: "Salvar endereço e contatos" }),
    );

    expect(contact).toHaveBeenCalledWith(
      { neighborhood: "Lapa" },
      expect.anything(),
    );

    const [, options] = contact.mock.calls[0] as [unknown, MutateOptions];
    options.onSuccess?.();
    expect(toast.success).toHaveBeenCalledWith(
      "Endereço e contatos atualizados",
    );
    options.onError?.(new Error("RLS"));
    expect(toast.error).toHaveBeenCalled();
  });

  it("não monta os formulários enquanto carrega", () => {
    setup({ data: null, isLoading: true });

    expect(
      screen.queryByRole("button", { name: "Salvar identificação" }),
    ).not.toBeInTheDocument();
  });

  it("deixa tentar de novo quando a busca falha", async () => {
    const { refetch } = setup({ data: null, isError: true });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(refetch).toHaveBeenCalled();
  });

  it("explica quando a conta não tem ONG", () => {
    setup({ myOng: null, data: null });

    expect(
      screen.getByText(/Não encontramos os dados da sua instituição/),
    ).toBeInTheDocument();
  });
});
