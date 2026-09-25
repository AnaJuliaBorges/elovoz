import {
  formatCnpj,
  formatDateBr,
  formatPhone,
  isValidCnpj,
  isValidPhone,
  onlyDigits,
} from "./masks";

describe("onlyDigits", () => {
  it("remove tudo que não é número", () => {
    expect(onlyDigits("(21) 99876-5432")).toBe("21998765432");
  });
});

describe("formatCnpj", () => {
  it("aplica a máscara conforme o usuário digita", () => {
    expect(formatCnpj("12")).toBe("12");
    expect(formatCnpj("12345")).toBe("12.345");
    expect(formatCnpj("12345678")).toBe("12.345.678");
    expect(formatCnpj("123456780001")).toBe("12.345.678/0001");
    expect(formatCnpj("12345678000195")).toBe("12.345.678/0001-95");
  });

  it("ignora o que passar de 14 dígitos", () => {
    expect(formatCnpj("123456780001959999")).toBe("12.345.678/0001-95");
  });
});

describe("formatPhone", () => {
  it("formata fixo com 10 dígitos", () => {
    expect(formatPhone("2132345678")).toBe("(21) 3234-5678");
  });

  it("formata celular com 11 dígitos", () => {
    expect(formatPhone("21998765432")).toBe("(21) 99876-5432");
  });
});

describe("isValidCnpj", () => {
  it("aceita CNPJ com dígitos verificadores corretos", () => {
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
    expect(isValidCnpj("11222333000181")).toBe(true);
  });

  it("recusa dígito verificador errado", () => {
    expect(isValidCnpj("11.222.333/0001-82")).toBe(false);
  });

  it("recusa tamanho errado e sequência repetida", () => {
    expect(isValidCnpj("112223330001")).toBe(false);
    expect(isValidCnpj("11111111111111")).toBe(false);
  });
});

describe("isValidPhone", () => {
  it("aceita 10 ou 11 dígitos", () => {
    expect(isValidPhone("(21) 3234-5678")).toBe(true);
    expect(isValidPhone("(21) 99876-5432")).toBe(true);
  });

  it("recusa números curtos demais", () => {
    expect(isValidPhone("99876543")).toBe(false);
  });
});

describe("formatDateBr", () => {
  it("põe as barras enquanto a pessoa digita", () => {
    expect(formatDateBr("2")).toBe("2");
    expect(formatDateBr("201")).toBe("20/1");
    expect(formatDateBr("20122")).toBe("20/12/2");
    expect(formatDateBr("20122026")).toBe("20/12/2026");
  });

  it("ignora o que não é número e corta no oitavo dígito", () => {
    expect(formatDateBr("20/12/2026999")).toBe("20/12/2026");
    expect(formatDateBr("ab20c12")).toBe("20/12");
  });
});
