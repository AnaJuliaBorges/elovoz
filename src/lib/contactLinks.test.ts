import { phoneLink, whatsappLink } from "./contactLinks";

describe("contactLinks", () => {
  it("monta o link do WhatsApp com o DDI", () => {
    expect(whatsappLink("(21) 99876-5432")).toBe("https://wa.me/5521998765432");
  });

  it("monta o link de ligação com o DDI", () => {
    expect(phoneLink("2133334444")).toBe("tel:+552133334444");
  });
});
