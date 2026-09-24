import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { useMyInterests } from "../hooks/useInterests";
import type { MyInterest } from "../model/interest";
import { MyInterestsList } from "./MyInterestsList";

vi.mock("../hooks/useInterests");

const interest: MyInterest = {
  id: "interest-1",
  need_id: "need-1",
  donor_id: "donor-1",
  message: "Tenho 10 cestas, falo pelo (21) 99999-1234",
  expected_quantity: 10,
  expected_deadline: "2026-12-20",
  created_at: "2026-09-20T12:00:00Z",
  need: {
    id: "need-1",
    title: "Cestas básicas",
    status: "partially_fulfilled",
    ong: { id: "ong-1", trade_name: "Casa Esperança" },
  },
};

function setup({
  data = [interest] as MyInterest[] | null,
  isLoading = false,
  isError = false,
} = {}) {
  const refetch = vi.fn();
  vi.mocked(useMyInterests).mockReturnValue({
    data,
    isLoading,
    isError,
    refetch,
  } as never);

  render(
    <MemoryRouter>
      <MyInterestsList />
    </MemoryRouter>,
  );

  return { refetch };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MyInterestsList", () => {
  it("mostra o interesse com a necessidade, a ONG e o que foi oferecido", () => {
    setup();

    expect(screen.getByRole("link", { name: "Cestas básicas" })).toHaveAttribute(
      "href",
      "/necessidades/need-1",
    );
    expect(screen.getByRole("link", { name: "Casa Esperança" })).toHaveAttribute(
      "href",
      "/ongs/ong-1",
    );
    expect(screen.getByText("Parcialmente atendida")).toBeInTheDocument();
    expect(screen.getByText("Enviado em 20/09/2026")).toBeInTheDocument();
    expect(screen.getByText("Quantidade: 10")).toBeInTheDocument();
    expect(screen.getByText("Até 20/12/2026")).toBeInTheDocument();
    expect(screen.getByText(/Tenho 10 cestas/)).toBeInTheDocument();
  });

  it("avisa quando a necessidade não está mais visível", () => {
    setup({ data: [{ ...interest, need: null, expected_quantity: null }] });

    expect(screen.getByText("Necessidade indisponível")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText(/Quantidade/)).not.toBeInTheDocument();
  });

  it("orienta quando ainda não há interesses", () => {
    setup({ data: [] });

    expect(
      screen.getByText("Nenhum interesse manifestado ainda"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Buscar necessidades" }),
    ).toHaveAttribute("href", "/necessidades");
  });

  it("não mostra lista enquanto carrega", () => {
    setup({ data: null, isLoading: true });

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("deixa tentar de novo quando a busca falha", async () => {
    const { refetch } = setup({ data: null, isError: true });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(refetch).toHaveBeenCalled();
  });
});
