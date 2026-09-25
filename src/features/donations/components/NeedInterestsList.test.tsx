import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { useNeedInterests } from "../hooks/useInterests";
import { useSetInterestAnswered } from "../hooks/useInterestMutations";
import type { Interest } from "../model/interest";
import { NeedInterestsList } from "./NeedInterestsList";

vi.mock("../hooks/useInterests");
vi.mock("../hooks/useInterestMutations");
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

type MutateOptions = { onError?: (error: unknown) => void };

const interest: Interest = {
  id: "interest-1",
  need_id: "need-1",
  donor_id: "donor-1",
  message: "Tenho 10 cestas, falo pelo (21) 99999-1234",
  expected_quantity: 10,
  expected_deadline: "2026-12-20",
  created_at: "2026-09-20T12:00:00Z",
  share_contact: false,
  contact_name: null,
  contact_email: null,
  contact_phone: null,
  answered_at: null,
};

function setup(overrides: Record<string, unknown> = {}) {
  const result = {
    data: [interest],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  };

  vi.mocked(useNeedInterests).mockReturnValue(result as never);

  const mutate = vi.fn();
  vi.mocked(useSetInterestAnswered).mockReturnValue({
    mutate,
    isPending: false,
  } as never);

  render(<NeedInterestsList needId="need-1" />);

  return { ...result, mutate };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("NeedInterestsList", () => {
  it("mostra a mensagem, a quantidade e o prazo de quem quer doar", () => {
    setup();

    expect(
      screen.getByRole("heading", { name: /^1 pessoa quer doar/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(interest.message!)).toBeInTheDocument();
    expect(screen.getByText("Quantidade: 10")).toBeInTheDocument();
    expect(screen.getByText("Até 20/12/2026")).toBeInTheDocument();
    expect(screen.getByText("20/09/2026")).toBeInTheDocument();
  });

  it("concorda o título no plural", () => {
    setup({ data: [interest, { ...interest, id: "interest-2" }] });

    expect(
      screen.getByRole("heading", { name: /^2 pessoas querem doar/ }),
    ).toBeInTheDocument();
  });

  it("explica a lista vazia", () => {
    setup({ data: [] });

    expect(
      screen.getByRole("heading", { name: "0 pessoas querem doar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Ninguém manifestou interesse ainda/),
    ).toBeInTheDocument();
  });

  it("mostra o contato quando o doador autorizou", () => {
    setup({
      data: [
        {
          ...interest,
          message: null,
          share_contact: true,
          contact_name: "Ana Souza",
          contact_email: "ana@teste.com",
          contact_phone: "21998765432",
        },
      ],
    });

    const contact = screen.getByRole("list", {
      name: "Contato de quem quer doar",
    });
    expect(contact).toHaveTextContent("Ana Souza");
    expect(screen.getByRole("link", { name: "ana@teste.com" })).toHaveAttribute(
      "href",
      "mailto:ana@teste.com",
    );
    expect(
      screen.getByRole("link", { name: "(21) 99876-5432" }),
    ).toHaveAttribute("href", "tel:+5521998765432");
    expect(screen.getByRole("link", { name: "WhatsApp" })).toHaveAttribute(
      "href",
      "https://wa.me/5521998765432",
    );
    // com contato, não faz sentido dizer para levar no horário
    expect(screen.queryByText(/Sem mensagem/)).not.toBeInTheDocument();
  });

  it("sem autorização, não mostra contato nenhum", () => {
    setup();

    expect(
      screen.queryByRole("list", { name: "Contato de quem quer doar" }),
    ).not.toBeInTheDocument();
  });

  it("explica o interesse que chegou sem mensagem", () => {
    setup({ data: [{ ...interest, message: null }] });

    expect(
      screen.getByText(/a pessoa deve levar a doação no horário/),
    ).toBeInTheDocument();
  });

  it("omite quantidade e prazo quando o doador não informou", () => {
    setup({
      data: [{ ...interest, expected_quantity: null, expected_deadline: null }],
    });

    expect(screen.queryByText(/Quantidade:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Até/)).not.toBeInTheDocument();
  });

  it("deixa tentar de novo quando falha", async () => {
    const result = setup({ data: undefined, isError: true });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(result.refetch).toHaveBeenCalled();
  });

  it("marca como respondido pela caixa do rodapé", async () => {
    const { mutate } = setup();
    const user = userEvent.setup();

    const answered = screen.getByRole("checkbox", {
      name: "Marcar como respondido",
    });
    expect(answered).not.toBeChecked();
    expect(answered).toHaveAccessibleDescription(
      "Toque quando já tiver falado com a pessoa",
    );

    await user.click(answered);

    expect(mutate).toHaveBeenCalledWith(
      { id: "interest-1", answered: true },
      expect.anything(),
    );

    const [, options] = mutate.mock.calls[0] as [unknown, MutateOptions];
    options.onError?.(new Error("42501"));
    expect(toast.error).toHaveBeenCalled();
  });

  it("deixa o respondido esmaecido e desmarcável", async () => {
    const { mutate } = setup({
      data: [{ ...interest, answered_at: "2026-09-24T12:00:00Z" }],
    });
    const user = userEvent.setup();

    const answered = screen.getByRole("checkbox", { name: "Respondido" });
    expect(answered).toBeChecked();
    expect(answered).toHaveAccessibleDescription("Toque para desmarcar");
    // só o conteúdo esmaece; a caixa continua nítida
    expect(screen.getByText(interest.message!).parentElement).toHaveClass(
      "opacity-60",
    );
    expect(answered.closest("label")?.parentElement).not.toHaveClass(
      "opacity-60",
    );

    await user.click(answered);

    expect(mutate).toHaveBeenCalledWith(
      { id: "interest-1", answered: false },
      expect.anything(),
    );
  });

  it("conta os sem resposta no título e mostra eles primeiro", () => {
    setup({
      data: [
        {
          ...interest,
          id: "respondido",
          message: "Já combinamos",
          answered_at: "2026-09-24T12:00:00Z",
        },
        { ...interest, id: "pendente", message: "Ainda sem resposta" },
      ],
    });

    expect(
      screen.getByRole("heading", { name: /2 pessoas querem doar\s+·\s+1 sem resposta/ }),
    ).toBeInTheDocument();

    // o pendente vem antes do respondido na página
    const pending = screen.getByText("Ainda sem resposta");
    const answered = screen.getByText("Já combinamos");
    expect(
      pending.compareDocumentPosition(answered) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
