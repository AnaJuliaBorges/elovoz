import { Link, useLocation } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from "@/components/ui";
import { withRedirect } from "../model/redirect";

/**
 * O visitante navega sem conta; quando tenta uma ação de doador ("Tenho
 * interesse", "Seguir"), este diálogo oferece criar a conta ou entrar, e o
 * `?voltar=` traz a pessoa de volta para a mesma tela depois.
 */
export function AuthRequiredDialog({
  trigger,
  title,
  description,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
}) {
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}`;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          {/* "Agora não" sem borda: é só fechar, não compete com as ações */}
          <AlertDialogCancel variant="ghost" size="sm" className="text-sm">
            Agora não
          </AlertDialogCancel>
          <Button variant="outline" size="sm" className="text-sm" asChild>
            <Link to={withRedirect("/login", returnTo)}>Já tenho conta</Link>
          </Button>
          <Button size="sm" className="text-sm" asChild>
            <Link to={withRedirect("/cadastrar", returnTo)}>Criar conta</Link>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
