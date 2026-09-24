import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
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
import type { UserType } from "@/features/auth";
import { useDeleteAccount } from "../hooks/useAccount";

const WHAT_GOES_AWAY: Record<Exclude<UserType, "admin">, string> = {
  donor:
    "Seus dados, os interesses que você manifestou e as instituições que você segue são apagados para sempre.",
  ong: "Seus dados, o cadastro da instituição e todas as necessidades publicadas são apagados para sempre, junto com os interesses recebidos.",
};

/** Exclusão da conta e dos dados (RNF03/LGPD). Admin não se exclui por aqui. */
export function DeleteAccountSection({ userType }: { userType: UserType }) {
  const navigate = useNavigate();
  const deleteAccount = useDeleteAccount();

  if (userType === "admin") {
    return (
      <p className="text-sm text-muted-foreground">
        Contas de administrador são removidas direto no Supabase.
      </p>
    );
  }

  function handleDelete() {
    deleteAccount.mutate(undefined, {
      onSuccess: () => {
        toast.success("Sua conta foi excluída");
        navigate("/", { replace: true });
      },
      onError: () =>
        toast.error("Não foi possível excluir sua conta. Tente de novo."),
    });
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-sm text-muted-foreground">
        {WHAT_GOES_AWAY[userType]} Não dá para desfazer.
      </p>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={deleteAccount.isPending}>
            <Trash2 aria-hidden="true" />
            {deleteAccount.isPending ? "Excluindo..." : "Excluir minha conta"}
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
            <AlertDialogDescription>
              {WHAT_GOES_AWAY[userType]} Não dá para desfazer.
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
    </div>
  );
}
