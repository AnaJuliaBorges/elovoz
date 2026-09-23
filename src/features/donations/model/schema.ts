import { z } from "zod";
import { todayIso } from "@/lib/dates";

// `expected_quantity` é integer no Postgres: acima disso o INSERT estoura
const MAX_QUANTITY = 1_000_000;

/**
 * A mensagem é obrigatória de propósito: a policy de `profiles` não deixa a
 * ONG ler nome nem telefone de quem manifestou interesse, então é por ela que
 * o contato chega.
 */
export const interestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(10, "Conte em pelo menos 10 caracteres o que você pode doar")
    .max(1000, "Use no máximo 1000 caracteres"),
  expected_quantity: z
    .string()
    .trim()
    .refine(
      (value) =>
        !value ||
        (/^\d+$/.test(value) &&
          Number(value) > 0 &&
          Number(value) <= MAX_QUANTITY),
      "Informe um número inteiro maior que zero",
    ),
  expected_deadline: z
    .string()
    .refine(
      (value) => !value || value >= todayIso(),
      "A data não pode estar no passado",
    ),
});

export type InterestFormInput = z.infer<typeof interestSchema>;

export const emptyInterestForm: InterestFormInput = {
  message: "",
  expected_quantity: "",
  expected_deadline: "",
};
