import { render, screen } from "@testing-library/react";
import { OngContacts } from "./OngContacts";

const ong = {
  contacts: [
    { id: "c-1", number: "21999991234", whatsapp: true },
    { id: "c-2", number: "2133331234", whatsapp: false },
  ],
  instagram: "@casasolidaria",
  facebook: null,
  website: "https://casasolidaria.org.br",
};

describe("OngContacts", () => {
  it("manda o WhatsApp para o wa.me e o fixo para o discador", () => {
    render(<OngContacts ong={ong} />);

    expect(
      screen.getByRole("link", { name: /\(21\) 99999-1234/ }),
    ).toHaveAttribute("href", "https://wa.me/5521999991234");
    expect(
      screen.getByRole("link", { name: "(21) 3333-1234" }),
    ).toHaveAttribute("href", "tel:+552133331234");
  });

  it("mostra as redes informadas", () => {
    render(<OngContacts ong={ong} />);

    expect(
      screen.getByRole("link", { name: "@casasolidaria" }),
    ).toHaveAttribute("href", "https://instagram.com/casasolidaria");
    expect(
      screen.getByRole("link", { name: "casasolidaria.org.br" }),
    ).toHaveAttribute("href", "https://casasolidaria.org.br");
    expect(
      screen.queryByRole("link", { name: /facebook/i }),
    ).not.toBeInTheDocument();
  });

  it("avisa quando não há contato nenhum", () => {
    render(
      <OngContacts
        ong={{ contacts: [], instagram: null, facebook: null, website: null }}
      />,
    );

    expect(
      screen.getByText("Esta instituição ainda não informou contatos."),
    ).toBeInTheDocument();
  });
});
