import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { OngAddress } from "./OngAddress";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const ong = {
  address: "Rua das Flores, 10",
  neighborhood: "Centro",
  city: { name: "Rio de Janeiro" },
  state: { uf: "RJ" },
};

const ADDRESS = "Rua das Flores, 10 — Centro, Rio de Janeiro - RJ";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("OngAddress", () => {
  it("mostra o endereço e o link do Google Maps em outra aba", () => {
    render(<OngAddress ong={ong} />);

    expect(screen.getByText(ADDRESS)).toBeInTheDocument();

    const maps = screen.getByRole("link", { name: "Google Maps" });
    expect(maps).toHaveAttribute(
      "href",
      expect.stringContaining("https://www.google.com/maps/search/?api=1&query="),
    );
    expect(maps).toHaveAttribute("target", "_blank");
  });

  it("copia o endereço e avisa", async () => {
    // o userEvent troca o `navigator.clipboard` por um falso no setup
    const user = userEvent.setup();
    render(<OngAddress ong={ong} />);

    await user.click(screen.getByRole("button", { name: "Copiar endereço" }));

    await expect(navigator.clipboard.readText()).resolves.toBe(ADDRESS);
    expect(toast.success).toHaveBeenCalledWith("Endereço copiado");
  });

  it("avisa quando o navegador não deixa copiar", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("NotAllowedError"),
    );
    render(<OngAddress ong={ong} />);

    await user.click(screen.getByRole("button", { name: "Copiar endereço" }));

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("Não foi possível copiar"),
    );
  });
});
