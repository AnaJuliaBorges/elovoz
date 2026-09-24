import { REDIRECT_PARAM, safeRedirect, withRedirect } from "./redirect";

describe("withRedirect", () => {
  it("anexa o caminho de volta codificado", () => {
    expect(withRedirect("/login", "/necessidades/1?pagina=2")).toBe(
      `/login?${REDIRECT_PARAM}=%2Fnecessidades%2F1%3Fpagina%3D2`,
    );
  });
});

describe("safeRedirect", () => {
  it("aceita caminho interno", () => {
    expect(safeRedirect("/ongs/1")).toBe("/ongs/1");
  });

  it("ignora vazio ou ausente", () => {
    expect(safeRedirect(null)).toBeNull();
    expect(safeRedirect(undefined)).toBeNull();
    expect(safeRedirect("")).toBeNull();
  });

  it("recusa endereço de outro site", () => {
    expect(safeRedirect("https://golpe.com")).toBeNull();
    expect(safeRedirect("//golpe.com")).toBeNull();
    expect(safeRedirect("/\\golpe.com")).toBeNull();
    expect(safeRedirect("javascript:alert(1)")).toBeNull();
  });
});
