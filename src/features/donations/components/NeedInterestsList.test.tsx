import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useNeedInterests } from "../hooks/useInterests";
import type { Interest } from "../model/interest";
import { NeedInterestsList } from "./NeedInterestsList";

vi.mock("../hooks/useInterests");

const interest: Interest = {
  id: "interest-1",
  need_id: "need-1",
  donor_id: "donor-1",
  message: "Tenho 10 cestas, falo pelo (21) 99999-1234",
  expected_quantity: 10,
  expected_deadline: "2026-12-20",
  created_at: "2026-09-20T12:00:00Z",
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
  render(<NeedInterestsList needId="need-1" />);

  return result;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("NeedInterestsList", () => {
  it("mostra a mensagem, a quantidade e o prazo de quem quer doar", () => {
    setup();

    expect(
      screen.getByRole("heading", { name: "1 pessoa quer doar" }),
    ).toBeInTheDocument();
    expect(screen.getByText(interest.message!)).toBeInTheDocument();
    expect(screen.getByText("Quantidade: 10")).toBeInTheDocument();
    expect(screen.getByText("Até 20/12/2026")).toBeInTheDocument();
    expect(screen.getByText("20/09/2026")).toBeInTheDocument();
  });

  it("concorda o título no plural", () => {
    setup({ data: [interest, { ...interest, id: "interest-2" }] });

    expect(
      screen.getByRole("heading", { name: "2 pessoas querem doar" }),
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
});
