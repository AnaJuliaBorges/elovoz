import { Link } from "react-router-dom";
import { ClipboardList, Plus } from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { useMyOng } from "@/features/ongs";
import { OngNeedItem } from "../components/OngNeedItem";
import { useOngNeeds } from "../hooks/useNeedQueries";

const NEW_NEED_PATH = "/painel/necessidades/nova";

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-32 w-full" />
      ))}
    </div>
  );
}

function OngNeedsList({ ongId }: { ongId: string }) {
  const { data: needs, isLoading, isError, refetch } = useOngNeeds(ongId);

  if (isLoading) return <ListSkeleton />;

  if (isError) {
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-2 rounded-md bg-destructive-light p-4 text-sm text-destructive"
      >
        Não foi possível carregar suas necessidades.
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (!needs?.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
        <span className="rounded-full bg-muted p-4">
          <ClipboardList
            className="size-7 text-muted-foreground"
            aria-hidden="true"
          />
        </span>
        <h2 className="font-medium">Nenhuma necessidade publicada</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Conte o que a ONG precisa agora para os doadores encontrarem vocês.
        </p>
        <Button asChild>
          <Link to={NEW_NEED_PATH}>
            <Plus aria-hidden="true" />
            Publicar a primeira
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {needs.map((need) => (
        <li key={need.id}>
          <OngNeedItem need={need} />
        </li>
      ))}
    </ul>
  );
}

export default function OngDashboardPage() {
  const { data: ong, isLoading, isError, refetch } = useMyOng();

  if (isLoading) return <ListSkeleton />;

  if (isError) {
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-2 rounded-md bg-destructive-light p-4 text-sm text-destructive"
      >
        Não foi possível carregar os dados da sua ONG.
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (!ong) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <h1 className="text-xl font-medium">Painel da ONG</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Não encontramos os dados da sua instituição. Se o cadastro foi
          interrompido, entre em contato com a equipe do Elovoz.
        </p>
      </div>
    );
  }

  const approved = ong.verification_status === "approved";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-medium">Painel da ONG</h1>
          <p className="text-sm text-muted-foreground">{ong.trade_name}</p>
        </div>

        {/* editar a instituição (dados e horários) fica no Perfil */}
        {approved && (
          <Button asChild>
            <Link to={NEW_NEED_PATH}>
              <Plus aria-hidden="true" />
              Nova necessidade
            </Link>
          </Button>
        )}
      </header>

      {ong.verification_status === "pending" && (
        <p role="status" className="rounded-md bg-warning-light p-4 text-sm">
          <strong className="font-medium">Cadastro em análise.</strong> Assim
          que nossa equipe aprovar a {ong.trade_name}, você poderá publicar
          necessidades por aqui.
        </p>
      )}

      {ong.verification_status === "rejected" && (
        <p
          role="status"
          className="rounded-md bg-destructive-light p-4 text-sm text-destructive"
        >
          <strong className="font-medium">Cadastro não aprovado.</strong> Não
          conseguimos verificar os dados da instituição. Entre em contato com a
          equipe do Elovoz para revisar o cadastro.
        </p>
      )}

      {approved && <OngNeedsList ongId={ong.id} />}
    </div>
  );
}
