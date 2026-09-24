import { Mail, MessageCircle, Phone, UserRound } from "lucide-react";
import { formatPhone } from "@/lib/masks";
import { phoneLink, whatsappLink } from "@/lib/contactLinks";
import type { Interest } from "../model/interest";

const LINK_CLASS =
  "flex items-center gap-2 text-secondary underline-offset-4 hover:underline";

/**
 * Contato que o doador autorizou a ONG a ver neste interesse. Não sabemos se
 * o telefone tem WhatsApp, então ele aparece com as duas opções.
 */
export function DonorContact({
  interest,
}: {
  interest: Pick<
    Interest,
    "contact_name" | "contact_email" | "contact_phone"
  >;
}) {
  const { contact_name, contact_email, contact_phone } = interest;

  return (
    <ul
      aria-label="Contato de quem quer doar"
      className="flex flex-col gap-1.5 rounded-md bg-muted/60 p-3 text-sm"
    >
      {contact_name && (
        <li className="flex items-center gap-2 font-medium">
          <UserRound className="size-4 shrink-0" aria-hidden="true" />
          {contact_name}
        </li>
      )}
      {contact_email && (
        <li>
          <a href={`mailto:${contact_email}`} className={LINK_CLASS}>
            <Mail className="size-4 shrink-0" aria-hidden="true" />
            <span className="break-all">{contact_email}</span>
          </a>
        </li>
      )}
      {contact_phone && (
        <li className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <a href={phoneLink(contact_phone)} className={LINK_CLASS}>
            <Phone className="size-4 shrink-0" aria-hidden="true" />
            {formatPhone(contact_phone)}
          </a>
          <a
            href={whatsappLink(contact_phone)}
            target="_blank"
            rel="noreferrer"
            className={LINK_CLASS}
          >
            <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
            WhatsApp
          </a>
        </li>
      )}
    </ul>
  );
}
