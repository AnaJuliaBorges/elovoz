import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Building2, MapPin } from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { useFollowedOngs, useToggleFollowOng } from "../hooks/useFollowOng";
import { followErrorMessage } from "../services/ongFollowers";
import { formatCityState, type FollowedOng } from "../model/ong";

function FollowedOngItem({ ong }: { ong: FollowedOng }) {
  const toggle = useToggleFollowOng(ong.id);
  const location = [ong.neighborhood, formatCityState(ong)]
    .filter(Boolean)
    .join(", ");

  function handleUnfollow() {
    toggle.mutate(true, {
      onSuccess: () =>
        toast.success(`Você deixou de seguir ${ong.trade_name}`),
      onError: (error) => toast.error(followErrorMessage(error)),
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-surface p-4">
      <div className="flex min-w-0 flex-col gap-1">
        <Link
          to={`/ongs/${ong.id}`}
          className="flex items-center gap-1.5 font-medium underline-offset-4 hover:underline"
        >
          <Building2
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          {ong.trade_name}
        </Link>

        {location && (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            {location}
          </span>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={toggle.isPending}
        onClick={handleUnfollow}
        aria-label={`Deixar de seguir ${ong.trade_name}`}
      >
        Deixar de seguir
      </Button>
    </div>
  );
}

/** Instituições que o doador segue (RF11), com atalho para deixar de seguir. */
export function FollowedOngsList() {
  const { data: ongs, isLoading, isError, refetch } = useFollowedOngs();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 2 }, (_, index) => (
          <Skeleton key={index} className="h-20 w-full" />
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
        Não foi possível carregar as instituições que você segue.
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (!ongs?.length) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center">
        <p className="font-medium">Você ainda não segue nenhuma instituição</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Siga uma ONG pelo perfil dela para ser avisado quando ela publicar
          uma necessidade.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/necessidades">Buscar necessidades</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {ongs.map((ong) => (
        <li key={ong.id}>
          <FollowedOngItem ong={ong} />
        </li>
      ))}
    </ul>
  );
}
