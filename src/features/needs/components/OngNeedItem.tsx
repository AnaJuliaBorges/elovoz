import { Pencil, Trash2 } from "lucide-react";
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
  type NeedWithCategory,
} from "../model/need";
import { UrgencyBadge } from "./NeedBadges";

/** Linha do painel da ONG: status (RF07), editar e excluir. */
export function OngNeedItem({ need }: { need: NeedWithCategory }) {
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
        </div>

        <UrgencyBadge urgency={need.urgency} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
