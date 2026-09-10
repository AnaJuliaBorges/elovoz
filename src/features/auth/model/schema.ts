import { z } from "zod";
import { isValidCnpj, isValidPhone } from "@/lib/masks";

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

export const ongDataSchema = z.object({
  trade_name: z.string().trim().min(2, "Informe o nome fantasia"),
  legal_name: z.string().trim().min(2, "Informe a razão social"),
  cnpj: z.string().refine(isValidCnpj, "CNPJ inválido"),
  mission: z
    .string()
    .trim()
    .min(20, "Conte em pelo menos 20 caracteres qual é a missão da ONG"),
});

export type OngDataFormInput = z.infer<typeof ongDataSchema>;

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .refine(
    (value) => !value || z.url().safeParse(value).success,
    "Endereço inválido — comece com https://",
  );

export const ongContactSchema = z.object({
  state_id: z.string().min(1, "Escolha o estado"),
  city_id: z.string().min(1, "Escolha a cidade"),
  neighborhood: z.string().trim().min(2, "Informe o bairro"),
  address: z.string().trim().min(5, "Informe o endereço"),
  contacts: z
    .array(
      z.object({
        number: z.string().refine(isValidPhone, "Telefone inválido"),
        whatsapp: z.boolean(),
      }),
    )
    .min(1, "Cadastre pelo menos um telefone"),
  instagram: z.string().trim().optional(),
  facebook: z.string().trim().optional(),
  website: optionalUrl,
});

export type OngContactFormInput = z.infer<typeof ongContactSchema>;
