import { z } from "zod";
import { isValidPhone } from "@/lib/masks";

export const profileSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome completo"),
  phone: z
    .string()
    .optional()
    .refine((value) => !value || isValidPhone(value), "Telefone inválido"),
});

export type ProfileFormInput = z.infer<typeof profileSchema>;
