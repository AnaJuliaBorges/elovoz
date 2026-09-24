import { onlyDigits } from "./masks";

const DDI = "55";

/** Só o número é guardado; o link de WhatsApp precisa do DDI na frente. */
export function whatsappLink(number: string): string {
  return `https://wa.me/${DDI}${onlyDigits(number)}`;
}

export function phoneLink(number: string): string {
  return `tel:+${DDI}${onlyDigits(number)}`;
}
