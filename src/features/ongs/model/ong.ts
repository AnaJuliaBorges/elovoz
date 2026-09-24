import { onlyDigits } from "@/lib/masks";
import type { OpeningHour } from "./openingHours";

export type VerificationStatus = "pending" | "approved" | "rejected";

/** O mínimo da ONG do usuário logado que o painel precisa. */
export interface MyOng {
  id: string;
  trade_name: string;
  verification_status: VerificationStatus;
}

export interface OngContact {
  id: string;
  number: string;
  whatsapp: boolean;
}

/** A ONG como o perfil público mostra (RF05), já com contatos e localização. */
export interface OngProfile {
  id: string;
  profile_id: string;
  trade_name: string;
  legal_name: string;
  cnpj: string;
  mission: string;
  neighborhood: string;
  address: string;
  instagram: string | null;
  facebook: string | null;
  website: string | null;
  verification_status: VerificationStatus;
  created_at: string;
  city: { name: string } | null;
  state: { uf: string } | null;
  contacts: OngContact[];
  opening_hours: OpeningHour[];
}

/** ONG que o doador segue, como a lista de "Minhas doações" mostra (RF11). */
export interface FollowedOng {
  id: string;
  trade_name: string;
  neighborhood: string;
  city: { name: string } | null;
  state: { uf: string } | null;
}

/** "Rio de Janeiro - RJ" */
export function formatCityState(
  ong: Pick<OngProfile, "city" | "state">,
): string {
  if (!ong.city) return "";

  return `${ong.city.name}${ong.state ? ` - ${ong.state.uf}` : ""}`;
}

/** "Rua das Flores, 10 — Centro, Rio de Janeiro - RJ" */
export function formatFullAddress(
  ong: Pick<OngProfile, "address" | "neighborhood" | "city" | "state">,
): string {
  const place = [ong.neighborhood, formatCityState(ong)]
    .filter(Boolean)
    .join(", ");

  return [ong.address, place].filter(Boolean).join(" — ");
}

const DDI = "55";

/** Só o número é guardado; o link de WhatsApp precisa do DDI na frente. */
export function whatsappLink(number: string): string {
  return `https://wa.me/${DDI}${onlyDigits(number)}`;
}

export function phoneLink(number: string): string {
  return `tel:+${DDI}${onlyDigits(number)}`;
}

export interface OngSocialLink {
  key: "instagram" | "facebook" | "website";
  label: string;
  href: string;
}

function hasProtocol(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function stripProtocol(value: string): string {
  return value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

/**
 * Instagram e Facebook são texto livre no cadastro: pode vir "@suaong",
 * "suaong" ou a URL inteira. O link sai normalizado; o rótulo mostra só o
 * arroba/usuário, que é o que a pessoa reconhece.
 */
function socialLink(
  key: "instagram" | "facebook",
  value: string,
): OngSocialLink {
  const host = key === "instagram" ? "instagram.com" : "facebook.com";

  if (hasProtocol(value)) {
    return { key, label: stripProtocol(value), href: value };
  }

  const handle = value.replace(/^@/, "");

  return {
    key,
    label: key === "instagram" ? `@${handle}` : handle,
    href: `https://${host}/${handle}`,
  };
}

/** Redes que a ONG informou, na ordem em que o perfil mostra. */
export function ongSocialLinks(
  ong: Pick<OngProfile, "instagram" | "facebook" | "website">,
): OngSocialLink[] {
  const links: OngSocialLink[] = [];

  if (ong.instagram) links.push(socialLink("instagram", ong.instagram.trim()));
  if (ong.facebook) links.push(socialLink("facebook", ong.facebook.trim()));

  if (ong.website) {
    const website = ong.website.trim();
    const href = hasProtocol(website) ? website : `https://${website}`;

    links.push({ key: "website", label: stripProtocol(website), href });
  }

  return links;
}
