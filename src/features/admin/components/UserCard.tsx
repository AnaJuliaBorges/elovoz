import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Building2, Mail, Phone, Trash2 } from "lucide-react";
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
  Badge,
  Button,
} from "@/components/ui";
import { formatPhone } from "@/lib/masks";
import { formatDate } from "@/lib/dates";
import { useDeleteUser } from "../hooks/useAdminUsers";
import {
  ONG_STATUS_LABELS,
  USER_TYPE_LABELS,
  type AdminUser,
} from "../model/user";

function deleteWarning(user: AdminUser): string {
  if (user.user_type === "ong") {
    return "A conta, a instituição e todas as necessidades publicadas são apagadas para sempre, junto com os interesses recebidos.";
  }

  if (user.user_type === "donor") {
    return "A conta, os interesses manifestados e as instituições seguidas são apagados para sempre.";
  }

  return "O login deste cadastro incompleto é apagado para sempre.";
}

/** Uma conta na gestão de usuários, com a exclusão quando ela é permitida. */
export function UserCard({
  user,
  canDelete,
}: {
  user: AdminUser;
  canDelete: boolean;
}) {
  const deleteUser = useDeleteUser();
  const displayName = user.name ?? user.email ?? "Sem nome";

  function handleDelete() {
    deleteUser.mutate(user.id, {
      onSuccess: () => toast.success(`Conta de ${displayName} excluída`),
      onError: () =>
        toast.error("Não foi possível excluir a conta. Tente de novo."),
    });
  }

  return (
    <article className="flex flex-col gap-3 rounded-lg border bg-surface p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="font-medium">{displayName}</h2>
          <span className="text-xs text-muted-foreground">
            Cadastro em {formatDate(user.created_at)} · Último acesso{" "}
            {user.last_sign_in_at
              ? formatDate(user.last_sign_in_at)
              : "nunca"}
          </span>
        </div>

        {user.user_type ? (
          <Badge variant="secondary">{USER_TYPE_LABELS[user.user_type]}</Badge>
        ) : (
          <Badge className="bg-warning-light text-foreground">
            Cadastro incompleto
          </Badge>
        )}
      </header>

      <ul className="flex flex-col gap-1 text-sm">
        {user.email && (
          <li className="flex items-center gap-2">
            <Mail
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="break-all">{user.email}</span>
          </li>
        )}
        {user.phone && (
          <li className="flex items-center gap-2">
            <Phone
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            {formatPhone(user.phone)}
          </li>
        )}
        {user.ong_id && user.ong_trade_name && (
          <li className="flex items-center gap-2">
            <Building2
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <Link
              to={`/ongs/${user.ong_id}`}
              className="underline-offset-4 hover:underline"
            >
              {user.ong_trade_name}
            </Link>
            {user.ong_status && (
              <span className="text-muted-foreground">
                ({ONG_STATUS_LABELS[user.ong_status]})
              </span>
            )}
          </li>
        )}
      </ul>

      {canDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="self-start text-sm text-destructive hover:text-destructive"
              disabled={deleteUser.isPending}
            >
              <Trash2 aria-hidden="true" />
              Excluir conta
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir a conta de {displayName}?</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteWarning(user)} Não dá para desfazer.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleDelete}>
                Excluir conta
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </article>
  );
}
