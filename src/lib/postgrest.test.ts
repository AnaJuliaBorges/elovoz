import { errorCode } from "./postgrest";

describe("errorCode", () => {
  it("devolve o código quando o erro tem um", () => {
    expect(errorCode({ code: "42501" })).toBe("42501");
  });

  it("devolve undefined para erro sem código", () => {
    expect(errorCode(new Error("rede"))).toBeUndefined();
    expect(errorCode(null)).toBeUndefined();
    expect(errorCode("42501")).toBeUndefined();
  });
});
