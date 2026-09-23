import { CalendarClock, Package } from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { useNeedInterests } from "../hooks/useInterests";

/**
 * Interesses que a ONG recebeu numa necessidade (RF06, lado de quem recebe).
 * Sem nome nem telefone de propósito: a policy de `profiles` não deixa a ONG
 * ler a linha de outra pessoa, então o contato vem na mensagem do doador.
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

  return (
    <section aria-labelledby="interesses" className="flex flex-col gap-3">
      <h2 id="interesses" className="font-medium">
        {received.length === 1
          ? "1 pessoa quer doar"
          : `${received.length} pessoas querem doar`}
      </h2>

      {received.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ninguém manifestou interesse ainda. Quando alguém manifestar, a
          mensagem aparece aqui com o contato que a pessoa deixar.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {received.map((interest) => (
            <li
              key={interest.id}
              className="flex flex-col gap-2 rounded-lg border bg-surface p-4"
            >
              <p className="text-xs text-muted-foreground">
                {formatDate(interest.created_at)}
              </p>

              {interest.message && (
                <p className="whitespace-pre-line">{interest.message}</p>
              )}

              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {interest.expected_quantity !== null && (
                  <li className="flex items-center gap-1.5">
                    <Package className="size-4 shrink-0" aria-hidden="true" />
                    Quantidade: {interest.expected_quantity}
                  </li>
                )}
                {interest.expected_deadline && (
                  <li className="flex items-center gap-1.5">
                    <CalendarClock
                      className="size-4 shrink-0"
                      aria-hidden="true"
                    />
                    Até {formatDate(interest.expected_deadline)}
                  </li>
                )}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
