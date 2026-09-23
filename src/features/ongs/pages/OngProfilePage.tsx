import { Link, useParams } from "react-router-dom";
import { CheckCircle2, MapPin } from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { BackButton } from "@/components/shared/BackButton";
import { formatCnpj } from "@/lib/masks";
import { formatDate } from "@/lib/dates";
import {
  NeedCard,
  isOpenForDonation,
  useOngNeeds,
  type NeedWithCategory,
} from "@/features/needs";
import { FollowOngButton } from "../components/FollowOngButton";
import { OngContacts } from "../components/OngContacts";
import { OngOpeningHours } from "../components/OngOpeningHours";
import { useOngProfile } from "../hooks/useOngProfile";
import {
  formatCityState,
  formatFullAddress,
  type OngProfile,
} from "../model/ong";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border bg-surface p-4">
      <h2 className="text-sm text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function ErrorAlert({
  children,
  onRetry,
}: {
  children: React.ReactNode;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-2 rounded-md bg-destructive-light p-4 text-sm text-destructive"
    >
      {children}
      <Button variant="outline" size="sm" onClick={onRetry}>
        Tentar de novo
      </Button>
    </div>
  );
}

/**
 * Necessidades da ONG no perfil: as que ainda dão para atender viram cards e
 * as atendidas ficam numa lista curta, que é a prova de trabalho da
 * instituição (RF10).
 */
function OngNeedsSections({ ongId }: { ongId: string }) {
  const { data: needs, isLoading, isError, refetch } = useOngNeeds(ongId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <Skeleton key={index} className="h-44 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorAlert onRetry={() => refetch()}>
        Não foi possível carregar as necessidades desta instituição.
      </ErrorAlert>
    );
  }

  const open: NeedWithCategory[] = [];
  const fulfilled: NeedWithCategory[] = [];

  // `filter(isOpenForDonation)` passaria o índice como segundo argumento e
  // sobrescreveria o "hoje" da função — daí a separação na mão
  for (const need of needs ?? []) {
    if (isOpenForDonation(need)) open.push(need);
    else if (need.status === "fulfilled") fulfilled.push(need);
  }

  return (
    <>
      <section aria-labelledby="precisa-agora" className="flex flex-col gap-3">
        <h2 id="precisa-agora" className="font-medium">
          Precisa agora
        </h2>

        {open.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma necessidade aberta no momento. Siga a instituição para saber
            quando ela publicar uma.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {open.map((need) => (
              <li key={need.id}>
                <NeedCard need={need} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {fulfilled.length > 0 && (
        <section aria-labelledby="ja-atendidas" className="flex flex-col gap-3">
          <h2 id="ja-atendidas" className="font-medium">
            Já atendidas ({fulfilled.length})
          </h2>

          <ul className="flex flex-col gap-2">
            {fulfilled.map((need) => (
              <li
                key={need.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border bg-surface p-3 text-sm"
              >
                <CheckCircle2
                  className="size-4 shrink-0 text-success"
                  aria-hidden="true"
                />
                <Link
                  to={`/necessidades/${need.id}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {need.title}
                </Link>
                <span className="text-muted-foreground">
                  em {formatDate(need.updated_at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function VerificationNotice({ ong }: { ong: OngProfile }) {
  if (ong.verification_status === "pending") {
    return (
      <p role="status" className="rounded-md bg-warning-light p-4 text-sm">
        <strong className="font-medium">Cadastro em análise.</strong> Enquanto
        nossa equipe não aprovar, este perfil não aparece para os doadores.
      </p>
    );
  }

  if (ong.verification_status === "rejected") {
    return (
      <p
        role="status"
        className="rounded-md bg-destructive-light p-4 text-sm text-destructive"
      >
        <strong className="font-medium">Cadastro não aprovado.</strong> Este
        perfil está visível apenas para a própria instituição e para a equipe do
        Elovoz.
      </p>
    );
  }

  return null;
}

export default function OngProfilePage() {
  const { id = "" } = useParams();
  const { data: ong, isLoading, isError, refetch } = useOngProfile(id);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <ErrorAlert onRetry={() => refetch()}>
          Não foi possível carregar o perfil da instituição.
        </ErrorAlert>
      </div>
    );
  }

  if (!ong) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <h1 className="text-xl font-medium">Instituição não encontrada</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          O perfil pode ter saído do ar ou o cadastro ainda não foi verificado
          pela equipe do Elovoz.
        </p>
        <Button variant="outline" asChild>
          <Link to="/necessidades">Ver necessidades</Link>
        </Button>
      </div>
    );
  }

  const cityState = formatCityState(ong);

  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <BackButton />

      <VerificationNotice ong={ong} />

      {/* no desktop o seguir sobe para o lado do título; no celular fica
          embaixo, onde o polegar alcança */}
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-medium">{ong.trade_name}</h1>
            <p className="text-sm text-muted-foreground">{ong.legal_name}</p>
          </div>

          {cityState && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              {ong.neighborhood}, {cityState}
            </p>
          )}
        </div>

        <FollowOngButton ongId={ong.id} />
      </header>

      <Section title="Missão">
        <p className="whitespace-pre-line">{ong.mission}</p>
      </Section>

      <Section title="Contato">
        <OngContacts ong={ong} />
      </Section>

      <Section title="Quando abre">
        <OngOpeningHours hours={ong.opening_hours} />
      </Section>

      <Section title="Onde fica">
        <p className="text-sm">{formatFullAddress(ong)}</p>
        <p className="text-sm text-muted-foreground">
          CNPJ {formatCnpj(ong.cnpj)}
        </p>
      </Section>

      <OngNeedsSections ongId={ong.id} />
    </article>
  );
}
