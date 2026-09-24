import { z } from "zod";
import { isValidPhone } from "@/lib/masks";

export const loginSchema = z.object({
  email: z.email("E-mail inválido"),
  password: z.string().min(1, "Informe sua senha"),
});

export type LoginFormInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email("E-mail inválido"),
});

export type ForgotPasswordFormInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "A senha precisa de pelo menos 8 caracteres"),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "As senhas não conferem",
    path: ["passwordConfirmation"],
  });

export type ResetPasswordFormInput = z.infer<typeof resetPasswordSchema>;

export const accountSchema = z
  .object({
    user_type: z.enum(["donor", "ong"], {
      message: "Escolha se você é doador ou ONG",
    }),
    name: z.string().trim().min(3, "Informe o nome completo"),
    email: z.email("E-mail inválido"),
    password: z.string().min(8, "A senha precisa de pelo menos 8 caracteres"),
    passwordConfirmation: z.string(),
    phone: z
      .string()
      .optional()
      .refine((value) => !value || isValidPhone(value), "Telefone inválido"),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "As senhas não conferem",
    path: ["passwordConfirmation"],
  });

export type AccountFormInput = z.infer<typeof accountSchema>;

// os schemas da instituição são da feature `ongs` (o painel também edita esses
// dados); aqui só re-exporta, sem usar no topo do módulo, porque `auth` e
// `ongs` se importam mutuamente
export {
  ongContactSchema,
  ongDataSchema,
  type OngContactFormInput,
  type OngDataFormInput,
} from "@/features/ongs";
