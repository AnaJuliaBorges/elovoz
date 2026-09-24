import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthRequiredDialog } from "./AuthRequiredDialog";

beforeAll(() => {
  // o AlertDialog do Radix usa APIs de ponteiro que o jsdom não implementa
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

describe("AuthRequiredDialog", () => {
  it("oferece criar conta ou entrar, voltando para a tela atual", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/necessidades/need-1"]}>
        <AuthRequiredDialog
          title="Crie sua conta para doar"
          description="Explicação"
          trigger={<button type="button">Tenho interesse</button>}
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Tenho interesse" }));

    expect(
      screen.getByRole("alertdialog", { name: "Crie sua conta para doar" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Criar conta" })).toHaveAttribute(
      "href",
      "/cadastrar?voltar=%2Fnecessidades%2Fneed-1",
    );
    expect(
      screen.getByRole("link", { name: "Já tenho conta" }),
    ).toHaveAttribute("href", "/login?voltar=%2Fnecessidades%2Fneed-1");

    await user.click(screen.getByRole("button", { name: "Agora não" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
