import { Link } from "react-router-dom";
import {
  Building2,
  CalendarClock,
  HandHeart,
  Package,
  UserCheck,
} from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { NeedStatusBadge } from "@/features/needs";
import { useMyInterests } from "../hooks/useInterests";
import type { MyInterest } from "../model/interest";

function InterestItem({ interest }: { interest: MyInterest }) {
  const { need } = interest;

  const details = [
    interest.expected_quantity
      ? { icon: Package, text: `Quantidade: ${interest.expected_quantity}` }
      : null,
    interest.expected_deadline
      ? {
          icon: CalendarClock,
          text: `Até ${formatDate(interest.expected_deadline)}`,
        }
      : null,
    interest.share_contact
      ? { icon: UserCheck, text: "Contato compartilhado" }
      : null,
  ].filter((item) => item !== null);

  return (
    <article className="flex flex-col gap-2 rounded-lg border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          Enviado em {formatDate(interest.created_at)}
        </span>
        {need && <NeedStatusBadge status={need.status} />}
      </div>

      {need ? (
        <Link
          to={`/necessidades/${need.id}`}
          className="leading-snug font-medium underline-offset-4 hover:underline"
        >
          {need.title}
        </Link>
      ) : (
        <p className="leading-snug font-medium text-muted-foreground">
          Necessidade indisponível
        </p>
      )}

      {need?.ong && (
        <Link
          to={`/ongs/${need.ong.id}`}
          className="flex items-center gap-1.5 self-start text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          <Building2 className="size-4 shrink-0" aria-hidden="true" />
          {need.ong.trade_name}
        </Link>
      )}

      {interest.message && (
        <p className="line-clamp-3 text-sm whitespace-pre-line">
          {interest.message}
        </p>
      )}

      {details.length > 0 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {details.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-1.5">
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

/**
 * Histórico dos interesses que o doador manifestou (RF06). Cancelar fica no
 * detalhe da necessidade, que é onde está o contexto do que foi oferecido.
 */
export function MyInterestsList() {
  const { data: interests, isLoading, isError, refetch } = useMyInterests();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-2 rounded-md bg-destructive-light p-4 text-sm text-destructive"
      >
        Não foi possível carregar seus interesses.
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (!interests?.length) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center">
        <span className="rounded-full bg-muted p-3">
          <HandHeart
            className="size-6 text-muted-foreground"
            aria-hidden="true"
          />
        </span>
        <p className="font-medium">Nenhum interesse manifestado ainda</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Encontre uma necessidade e toque em “Tenho interesse” para avisar a
          instituição.
        </p>
        <Button asChild size="sm">
          <Link to="/necessidades">Buscar necessidades</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {interests.map((interest) => (
        <li key={interest.id}>
          <InterestItem interest={interest} />
        </li>
      ))}
    </ul>
  );
}
