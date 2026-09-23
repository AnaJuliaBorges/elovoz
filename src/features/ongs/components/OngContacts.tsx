import { Facebook, Globe, Instagram, MessageCircle, Phone } from "lucide-react";
import { formatPhone } from "@/lib/masks";
import {
  ongSocialLinks,
  phoneLink,
  whatsappLink,
  type OngProfile,
  type OngSocialLink,
} from "../model/ong";

const SOCIAL_ICONS: Record<OngSocialLink["key"], typeof Globe> = {
  instagram: Instagram,
  facebook: Facebook,
  website: Globe,
};

const LINK_CLASS =
  "flex items-center gap-2 text-secondary underline-offset-4 hover:underline";

/** Telefones e redes da ONG (RF05). WhatsApp abre a conversa, o resto liga. */
export function OngContacts({
  ong,
}: {
  ong: Pick<OngProfile, "contacts" | "instagram" | "facebook" | "website">;
}) {
  const socials = ongSocialLinks(ong);

  if (!ong.contacts.length && !socials.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Esta instituição ainda não informou contatos.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {ong.contacts.map((contact) => (
        <li key={contact.id}>
          <a
            className={LINK_CLASS}
            href={
              contact.whatsapp
                ? whatsappLink(contact.number)
                : phoneLink(contact.number)
            }
            target={contact.whatsapp ? "_blank" : undefined}
            rel={contact.whatsapp ? "noreferrer" : undefined}
          >
            {contact.whatsapp ? (
              <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <Phone className="size-4 shrink-0" aria-hidden="true" />
            )}
            {formatPhone(contact.number)}
            {contact.whatsapp && (
              <span className="text-xs text-muted-foreground">WhatsApp</span>
            )}
          </a>
        </li>
      ))}

      {socials.map((social) => {
        const Icon = SOCIAL_ICONS[social.key];

        return (
          <li key={social.key}>
            <a
              className={LINK_CLASS}
              href={social.href}
              target="_blank"
              rel="noreferrer"
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {social.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
