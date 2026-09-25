import { CheckCircle2, HandHeart, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useDeleteNeed, useUpdateNeedStatus } from "../hooks/useNeedMutations";
import { needErrorMessage } from "../services/needs";
import {
  NEED_STATUSES,
  NEED_STATUS_LABELS,
  type NeedStatus,
  type NeedWithInterestCount,
} from "../model/need";
import { UrgencyBadge } from "./NeedBadges";

const TAG_CLASS =
  "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium";

/**
 * Interesses recebidos, separados em "sem resposta" (em destaque: é o que a
 * ONG precisa resolver) e "respondidos". Cada tag leva ao detalhe, onde está
 * a lista para marcar.
 */
function InterestTags({
  need,
  className,
}: {
  need: NeedWithInterestCount;
  className?: string;
}) {
  const pending = need.interest_count - need.answered_count;

  if (need.interest_count <= 0) return null;

  return (
    <div
      role="group"
      aria-label="Interesses recebidos"
      className={cn("flex-wrap items-center gap-2", className)}
    >
      {pending > 0 && (
        <Link
          to={`/necessidades/${need.id}`}
          className={cn(
            TAG_CLASS,
            "bg-primary/10 text-primary hover:bg-primary/15",
          )}
        >
          <HandHeart className="size-4 shrink-0" aria-hidden="true" />
          {pending} sem resposta
        </Link>
      )}
      {need.answered_count > 0 && (
        <Link
          to={`/necessidades/${need.id}`}
          className={cn(
            TAG_CLASS,
            "bg-success-light text-foreground hover:bg-success-light/70",
          )}
        >
          <CheckCircle2
            className="size-4 shrink-0 text-success"
            aria-hidden="true"
          />
          {need.answered_count === 1
            ? "1 respondido"
            : `${need.answered_count} respondidos`}
        </Link>
      )}
    </div>
  );
}

/**
 * Linha do painel da ONG: status (RF07), editar e excluir, e os interesses
 * recebidos — quantos ainda sem resposta e quantos já respondidos.
 */
export function OngNeedItem({ need }: { need: NeedWithInterestCount }) {
  const updateStatus = useUpdateNeedStatus();
  const deleteNeed = useDeleteNeed();

  // enquanto salva, mostra o status escolhido em vez do que está no cache
  const status = updateStatus.isPending
    ? updateStatus.variables.status
    : need.status;

  function handleStatusChange(value: string) {
    updateStatus.mutate(
      { id: need.id, status: value as NeedStatus },
      {
        onSuccess: () => toast.success("Status atualizado"),
        onError: (error) =>
          toast.error(
            needErrorMessage(error, "Não foi possível atualizar o status."),
          ),
      },
    );
  }

  function handleDelete() {
    deleteNeed.mutate(need.id, {
      onSuccess: () => toast.success("Necessidade excluída"),
      onError: (error) =>
        toast.error(
          needErrorMessage(error, "Não foi possível excluir a necessidade."),
        ),
    });
  }

  const details = [
    need.category?.name,
    need.quantity ? `Quantidade: ${need.quantity}` : null,
    need.deadline ? `Até ${formatDate(need.deadline)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      aria-label={need.title}
      className={cn(
        "flex flex-col gap-4 rounded-lg border bg-surface p-4",
        deleteNeed.isPending && "opacity-50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            to={`/necessidades/${need.id}`}
            className="font-medium hover:underline"
          >
            {need.title}
          </Link>
          {details && (
            <p className="text-sm text-muted-foreground">{details}</p>
          )}
          {/* no celular, embaixo do título; no desktop, ao lado do status */}
          <InterestTags need={need} className="mt-2 flex md:hidden" />
        </div>

        <UrgencyBadge urgency={need.urgency} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={status}
          onValueChange={handleStatusChange}
          disabled={updateStatus.isPending || deleteNeed.isPending}
        >
          <SelectTrigger
            className="w-full sm:w-auto sm:min-w-60"
            aria-label="Status"
          >
            <SelectValue>{NEED_STATUS_LABELS[status]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {NEED_STATUSES.map((option) => (
                <SelectItem key={option} value={option}>
                  {NEED_STATUS_LABELS[option]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <InterestTags need={need} className="hidden md:ml-2 md:flex" />

        <div className="flex gap-1 sm:ml-auto">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/painel/necessidades/${need.id}/editar`}>
              <Pencil aria-hidden="true" />
              Editar
            </Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                disabled={deleteNeed.isPending}
              >
                <Trash2 aria-hidden="true" />
                Excluir
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir esta necessidade?</AlertDialogTitle>
                <AlertDialogDescription>
                  “{need.title}” sai da busca, e os interesses que doadores já
                  manifestaram nela também são apagados. Não dá para desfazer.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </article>
  );
}
