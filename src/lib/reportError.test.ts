import { reportError } from "./reportError";

describe("reportError", () => {
  const consoleError = vi
    .spyOn(console, "error")
    .mockImplementation(() => undefined);

  beforeEach(() => {
    consoleError.mockClear();
  });

  it("loga no console em DEV com origem e detalhe", () => {
    const error = new Error("falhou");

    reportError(error, { source: "query", detail: '["profile"]' });

    expect(consoleError).toHaveBeenCalledWith(
      '[query ["profile"]] falhou',
      error,
    );
  });

  it("usa só a origem quando não há detalhe", () => {
    reportError("erro em texto", { source: "route" });

    expect(consoleError).toHaveBeenCalledWith(
      "[route] erro em texto",
      "erro em texto",
    );
  });

  it("converte valores que não são Error nem string", () => {
    reportError({ code: 42 }, { source: "mutation" });

    expect(consoleError).toHaveBeenCalledWith("[mutation] [object Object]", {
      code: 42,
    });
  });
});
