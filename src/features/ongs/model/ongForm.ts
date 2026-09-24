import { z } from "zod";
import { formatPhone, isValidCnpj, isValidPhone } from "@/lib/masks";
import type { OngEditable } from "./ong";

/** O que a ONG edita no painel: razão social e CNPJ ficam como o admin verificou. */
export const ongIdentitySchema = z.object({
  trade_name: z.string().trim().min(2, "Informe o nome fantasia"),
  mission: z
    .string()
    .trim()
    .min(20, "Conte em pelo menos 20 caracteres qual é a missão da ONG"),
});

export type OngIdentityFormInput = z.infer<typeof ongIdentitySchema>;

/** Dados institucionais completos, do cadastro. */
export const ongDataSchema = ongIdentitySchema.extend({
  legal_name: z.string().trim().min(2, "Informe a razão social"),
  cnpj: z.string().refine(isValidCnpj, "CNPJ inválido"),
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

/** Banco → formulários do painel: telefone mascarado e nulos viram "". */
export function toOngForms(ong: OngEditable): {
  identity: OngIdentityFormInput;
  contact: OngContactFormInput;
} {
  return {
    identity: { trade_name: ong.trade_name, mission: ong.mission },
    contact: {
      state_id: ong.state_id,
      city_id: ong.city_id,
      neighborhood: ong.neighborhood,
      address: ong.address,
      // sem telefone salvo, abre com uma linha vazia para preencher
      contacts: ong.contacts.length
        ? ong.contacts.map((contact) => ({
            number: formatPhone(contact.number),
            whatsapp: contact.whatsapp,
          }))
        : [{ number: "", whatsapp: false }],
      instagram: ong.instagram ?? "",
      facebook: ong.facebook ?? "",
      website: ong.website ?? "",
    },
  };
}
