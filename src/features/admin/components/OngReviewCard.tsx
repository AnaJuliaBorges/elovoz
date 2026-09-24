import { Link } from "react-router-dom";
import { toast } from "sonner";
import { MapPin, UserRound } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from "@/components/ui";
import { formatCnpj, formatPhone } from "@/lib/masks";
import { formatDate } from "@/lib/dates";
import {
  OngContacts,
  formatFullAddress,
  type OngForReview,
} from "@/features/ongs";
import { useSetOngStatus } from "../hooks/useOngReview";
import { ACTIONS_BY_STATUS, type ReviewAction } from "../model/review";

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs text-muted-foreground">{label}</h3>
      {children}
    </div>
  );
}

/**
 * Uma ONG na fila do admin (RF08), com o que dá para conferir sem documentos:
 * CNPJ (numa consulta pública), responsável, contatos, redes e endereço.
 */
export function OngReviewCard({ ong }: { ong: OngForReview }) {
  const setStatus = useSetOngStatus();

  function run(action: ReviewAction) {
    setStatus.mutate(
      { id: ong.id, status: action.to },
      {
        onSuccess: () => toast.success(action.success),
        onError: () =>
          toast.error("Não foi possível atualizar o cadastro. Tente de novo."),
      },
    );
  }

  return (
    <article className="flex flex-col gap-4 rounded-lg border bg-surface p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="font-medium">{ong.trade_name}</h2>
          <p className="text-sm text-muted-foreground">{ong.legal_name}</p>
        </div>
        <span className="text-xs text-muted-foreground">
          Cadastrada em {formatDate(ong.created_at)}
        </span>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Detail label="CNPJ">
          <p className="text-sm tabular-nums">{formatCnpj(ong.cnpj)}</p>
        </Detail>

        <Detail label="Responsável pela conta">
          {ong.responsible ? (
            <p className="flex items-center gap-1.5 text-sm">
              <UserRound
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              {ong.responsible.name}
              {ong.responsible.phone &&
                ` · ${formatPhone(ong.responsible.phone)}`}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Não informado</p>
          )}
        </Detail>

        <Detail label="Endereço">
          <p className="flex items-start gap-1.5 text-sm">
            <MapPin
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            {formatFullAddress(ong)}
          </p>
        </Detail>

        <Detail label="Contatos e redes">
          <OngContacts ong={ong} />
        </Detail>
      </div>

      <Detail label="Missão">
        <p className="text-sm whitespace-pre-line">{ong.mission}</p>
      </Detail>

      <footer className="flex flex-wrap items-center gap-2 border-t pt-4">
        {ACTIONS_BY_STATUS[ong.verification_status].map((action) =>
          action.confirm ? (
            <AlertDialog key={action.to}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={setStatus.isPending}
                >
                  {action.label}
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{action.confirm.title}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {ong.trade_name}: {action.confirm.description}
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => run(action)}
                  >
                    {action.label}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              key={action.to}
              size="sm"
              disabled={setStatus.isPending}
              onClick={() => run(action)}
            >
              {action.label}
            </Button>
          ),
        )}

        <Button variant="link" size="sm" className="ml-auto" asChild>
          <Link to={`/ongs/${ong.id}`}>Ver perfil</Link>
        </Button>
      </footer>
    </article>
  );
}
