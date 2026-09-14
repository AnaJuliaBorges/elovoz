import { z } from "zod";
import { todayIso } from "@/lib/dates";
import type { Need } from "./need";

// `quantity` é integer no Postgres: acima disso o INSERT estoura
const MAX_QUANTITY = 1_000_000;

export const needSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Dê um título com pelo menos 3 caracteres")
    .max(120, "Use no máximo 120 caracteres"),
  category_id: z.string().min(1, "Escolha a categoria"),
  description: z.string().trim().max(1000, "Use no máximo 1000 caracteres"),
  quantity: z
    .string()
    .trim()
    .refine(
      (value) =>
        !value || (/^\d+$/.test(value) && Number(value) > 0 && Number(value) <= MAX_QUANTITY),
      "Informe um número inteiro maior que zero",
    ),
  urgency: z.enum(["low", "medium", "high"], {
    message: "Escolha a urgência",
  }),
  deadline: z
    .string()
    .refine(
      (value) => !value || value >= todayIso(),
      "O prazo não pode estar no passado",
    ),
});

export type NeedFormInput = z.infer<typeof needSchema>;

export const emptyNeedForm: NeedFormInput = {
  title: "",
  category_id: "",
  description: "",
  quantity: "",
  urgency: "medium",
  deadline: "",
};

export function needToForm(need: Need): NeedFormInput {
  return {
    title: need.title,
    category_id: need.category_id,
    description: need.description ?? "",
    quantity: need.quantity?.toString() ?? "",
    urgency: need.urgency,
    deadline: need.deadline ?? "",
  };
}
