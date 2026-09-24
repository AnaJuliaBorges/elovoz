import { profileSchema } from "./schema";

describe("profileSchema", () => {
  it("aceita nome e telefone válidos", () => {
    expect(
      profileSchema.safeParse({ name: "Ana Souza", phone: "(21) 99876-5432" })
        .success,
    ).toBe(true);
  });

  it("aceita telefone em branco", () => {
    expect(profileSchema.safeParse({ name: "Ana", phone: "" }).success).toBe(
      true,
    );
  });

  it("recusa nome curto", () => {
    const result = profileSchema.safeParse({ name: " A " });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Informe o nome completo");
  });

  it("recusa telefone incompleto", () => {
    const result = profileSchema.safeParse({ name: "Ana", phone: "(21) 9987" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Telefone inválido");
  });
});
