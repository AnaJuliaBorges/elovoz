import { z } from "zod";
import { parseBrDate, todayIso } from "@/lib/dates";

// `expected_quantity` é integer no Postgres: acima disso o INSERT estoura
const MAX_QUANTITY = 1_000_000;

/**
 * Tudo é opcional: quem só vai levar a doação no horário de funcionamento
 * envia sem escrever nada. Para a ONG poder combinar a entrega, o doador marca
 * `share_contact` e o banco anexa nome, e-mail e telefone do cadastro.
 */
export const interestSchema = z.object({
  message: z.string().trim().max(1000, "Use no máximo 1000 caracteres"),
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
  // digitada como DD/MM/AAAA; o service converte para a coluna `date`
  expected_deadline: z
    .string()
    .refine(
      (value) => !value || parseBrDate(value) !== null,
      "Data inválida. Use o formato dd/mm/aaaa",
    )
    .refine((value) => {
      const iso = parseBrDate(value);
      return !iso || iso >= todayIso();
    }, "A data não pode estar no passado"),
  share_contact: z.boolean(),
});

export type InterestFormInput = z.infer<typeof interestSchema>;

export const emptyInterestForm: InterestFormInput = {
  message: "",
  expected_quantity: "",
  expected_deadline: "",
  // consentimento da LGPD: começa desmarcado, a pessoa escolhe marcar
  share_contact: false,
};
