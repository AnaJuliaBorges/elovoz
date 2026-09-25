import { toast } from "sonner";
import { CalendarClock, Package } from "lucide-react";
import { Button, Checkbox, Skeleton } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useNeedInterests } from "../hooks/useInterests";
import { useSetInterestAnswered } from "../hooks/useInterestMutations";
import type { Interest } from "../model/interest";
import { DonorContact } from "./DonorContact";

function ReceivedInterest({ interest }: { interest: Interest }) {
  const setAnswered = useSetInterestAnswered();
  const answered = interest.answered_at !== null;

  function toggle() {
    setAnswered.mutate(
      { id: interest.id, answered: !answered },
      {
        onError: () =>
          toast.error("Não foi possível atualizar. Tente de novo."),
      },
    );
  }

  const titleId = `resposta-${interest.id}`;
  const hintId = `resposta-dica-${interest.id}`;

  return (
    <li className="flex flex-col gap-3 rounded-lg border bg-surface p-4">
      {/* respondido sai de foco; o rodapé não, para ficar claro que dá para
          desmarcar */}
      <div
        className={cn(
          "flex flex-col gap-3 transition-opacity",
          answered && "opacity-60",
        )}
      >
        <p className="text-xs text-muted-foreground">
          {formatDate(interest.created_at)}
        </p>

        {interest.message ? (
          <p className="whitespace-pre-line">{interest.message}</p>
        ) : (
          !interest.share_contact && (
            <p className="text-sm text-muted-foreground">
              Sem mensagem: a pessoa deve levar a doação no horário de
              funcionamento.
            </p>
          )
        )}

        {interest.share_contact && <DonorContact interest={interest} />}

        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground empty:hidden">
          {interest.expected_quantity !== null && (
            <li className="flex items-center gap-1.5">
              <Package className="size-4 shrink-0" aria-hidden="true" />
              Quantidade: {interest.expected_quantity}
            </li>
          )}
          {interest.expected_deadline && (
            <li className="flex items-center gap-1.5">
              <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
              Até {formatDate(interest.expected_deadline)}
            </li>
          )}
        </ul>
      </div>

      <div className="border-t pt-3">
        {/* o bloco inteiro é clicável e reage ao mouse, e o texto diz o que
            o toque faz em cada estado */}
        <label
          className={cn(
            "-mx-2 flex w-fit cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 transition-colors",
            answered ? "hover:bg-muted" : "hover:bg-primary/10",
          )}
        >
          <Checkbox
            className="size-5"
            checked={answered}
            disabled={setAnswered.isPending}
            // o nome é só o título; a dica vira descrição, sem ser lida duas vezes
            aria-labelledby={titleId}
            aria-describedby={hintId}
            onCheckedChange={toggle}
          />
          <span className="flex flex-col">
            <span
              id={titleId}
              className={cn(
                "text-sm font-medium",
                answered ? "text-success" : "text-primary",
              )}
            >
              {answered ? "Respondido" : "Marcar como respondido"}
            </span>
            <span id={hintId} className="text-xs text-muted-foreground">
              {answered
                ? "Toque para desmarcar"
                : "Toque quando já tiver falado com a pessoa"}
            </span>
          </span>
        </label>
      </div>
    </li>
  );
}

/**
 * Interesses que a ONG recebeu numa necessidade (RF06, lado de quem recebe).
 * A policy de `profiles` não deixa a ONG ler o cadastro de ninguém: o contato
 * só aparece quando o doador autorizou naquele interesse (`share_contact`).
 * Os ainda sem resposta vêm primeiro, que é o que a ONG precisa resolver.
 */
export function NeedInterestsList({ needId }: { needId: string }) {
  const {
    data: interests,
    isLoading,
    isError,
    refetch,
  } = useNeedInterests(needId);

  if (isLoading) return <Skeleton className="h-24 w-full" />;

  if (isError) {
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-2 rounded-md bg-destructive-light p-4 text-sm text-destructive"
      >
        Não foi possível carregar os interesses recebidos.
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  const received = interests ?? [];
  const pending = received.filter((interest) => interest.answered_at === null);
  const answered = received.filter((interest) => interest.answered_at !== null);

  return (
    <section aria-labelledby="interesses" className="flex flex-col gap-3">
      <h2 id="interesses" className="font-medium">
        {received.length === 1
          ? "1 pessoa quer doar"
          : `${received.length} pessoas querem doar`}
        {pending.length > 0 && (
          <>
            {/* o espaço fica fora do span: dentro, o leitor de tela o descarta */}{" "}
            <span className="font-normal text-muted-foreground">
              · {pending.length} sem resposta
            </span>
          </>
        )}
      </h2>

      {received.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ninguém manifestou interesse ainda. Quando alguém manifestar, aparece
          aqui, com a mensagem e o contato se a pessoa autorizar.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {[...pending, ...answered].map((interest) => (
            <ReceivedInterest key={interest.id} interest={interest} />
          ))}
        </ul>
      )}
    </section>
  );
}
