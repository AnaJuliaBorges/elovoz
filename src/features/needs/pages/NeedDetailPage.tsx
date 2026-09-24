import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowRight, Building2, MapPin, Pencil } from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { BackButton } from "@/components/shared/BackButton";
import { formatDate } from "@/lib/dates";
import { useProfile } from "@/features/auth";
import { useMyOng } from "@/features/ongs";
import { DonorInterestSection, NeedInterestsList } from "@/features/donations";
import { NeedStatusBadge, UrgencyBadge } from "../components/NeedBadges";
import { useNeed } from "../hooks/useNeedQueries";
import { formatOngLocation, isOpenForDonation } from "../model/need";

export default function NeedDetailPage() {
  const { id = "" } = useParams();
  const { pathname } = useLocation();
  const { data: need, isLoading, isError, refetch } = useNeed(id);

  const { data: profile } = useProfile();
  const { data: myOng } = useMyOng({ enabled: profile?.user_type === "ong" });

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
      <div
        role="alert"
        className="mx-auto flex max-w-2xl flex-col items-start gap-2 rounded-md bg-destructive-light p-4 text-sm text-destructive"
      >
        Não foi possível carregar a necessidade.
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (!need) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <h1 className="text-xl font-medium">Necessidade não encontrada</h1>
        <p className="text-sm text-muted-foreground">
          Ela pode ter sido removida pela ONG.
        </p>
        <Button variant="outline" asChild>
          <Link to="/necessidades">Ver outras necessidades</Link>
        </Button>
      </div>
    );
  }

  const isOwner = !!myOng && myOng.id === need.ong_id;
  const location = formatOngLocation(need.ong);

  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center gap-2">
        <BackButton />
        <span className="text-sm text-muted-foreground">
          {need.category?.name}
        </span>
      </div>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <UrgencyBadge urgency={need.urgency} />
          <NeedStatusBadge status={need.status} />
        </div>
        <h1 className="text-2xl font-medium">{need.title}</h1>
      </header>

      {need.description && (
        <p className="whitespace-pre-line">{need.description}</p>
      )}

      <dl className="grid grid-cols-2 gap-4 rounded-lg border bg-surface p-4">
        <div className="flex flex-col gap-1">
          <dt className="text-sm text-muted-foreground">Quantidade</dt>
          <dd className="font-medium">{need.quantity ?? "Não informada"}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-sm text-muted-foreground">Prazo</dt>
          <dd className="font-medium">
            {need.deadline ? formatDate(need.deadline) : "Sem prazo"}
          </dd>
        </div>
      </dl>

      <DonorInterestSection
        needId={need.id}
        accepting={isOpenForDonation(need)}
      />

      <section
        aria-labelledby="quem-precisa"
        className="flex flex-col gap-3 rounded-lg border bg-surface p-4"
      >
        <h2 id="quem-precisa" className="text-sm text-muted-foreground">
          Quem precisa
        </h2>

        {/* no desktop o botão vai para a direita do nome da ONG; no celular
            desce para baixo dele, do tamanho do texto */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex flex-col gap-1">
            <p className="flex items-center gap-2 font-medium">
              <Building2 className="size-5 text-secondary" aria-hidden="true" />
              {need.ong.trade_name}
            </p>

            {location && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4" aria-hidden="true" />
                {location}
              </p>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="self-start text-sm sm:self-auto"
            asChild
          >
            <Link to={`/ongs/${need.ong.id}`}>
              Ver perfil da ONG
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>

      {/* `from` leva de volta para cá depois de salvar, em vez de jogar quem
          veio do detalhe no painel da ONG */}
      {isOwner && <NeedInterestsList needId={need.id} />}

      {isOwner && (
        <Button asChild>
          <Link
            to={`/painel/necessidades/${need.id}/editar`}
            state={{ from: pathname }}
          >
            <Pencil aria-hidden="true" />
            Editar necessidade
          </Link>
        </Button>
      )}
    </article>
  );
}
