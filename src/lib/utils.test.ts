import { cn, getErrorMessage } from "./utils";

describe("cn", () => {
  it("junta classes e resolve conflitos do tailwind", () => {
    const hidden = false;

    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", hidden && "hidden", "font-medium")).toBe(
      "text-sm font-medium",
    );
  });
});

describe("getErrorMessage", () => {
  it("extrai a mensagem de um Error", () => {
    expect(getErrorMessage(new Error("deu ruim"))).toBe("deu ruim");
  });

  it("extrai a mensagem de um erro do supabase (objeto puro)", () => {
    expect(getErrorMessage({ message: "row level security" })).toBe(
      "row level security",
    );
  });

  it("devolve null quando não há mensagem aproveitável", () => {
    expect(getErrorMessage(null)).toBeNull();
    expect(getErrorMessage("texto solto")).toBeNull();
    expect(getErrorMessage({ message: "" })).toBeNull();
  });
});
