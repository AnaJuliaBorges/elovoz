import { Link } from "react-router-dom";
import { Clock3 } from "lucide-react";
import { Button } from "@/components/ui";

export function PendingReview({ tradeName }: { tradeName: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <span className="rounded-full bg-warning-light p-4">
        <Clock3 className="size-8 text-warning" />
      </span>

      <h2 className="text-xl font-medium">Cadastro em análise</h2>

      <p className="max-w-md text-sm text-muted-foreground">
        Recebemos o cadastro da <strong>{tradeName}</strong>. Nossa equipe
        confere os dados institucionais antes de publicar o perfil — assim quem
        doa sabe que a instituição é real. Você recebe um aviso assim que a
        verificação terminar.
      </p>

      <p className="max-w-md text-sm text-muted-foreground">
        Enquanto isso, já dá para entrar e navegar pelas necessidades de outras
        instituições. Publicar necessidades só é liberado depois da aprovação.
      </p>

      <Button asChild className="mt-2">
        <Link to="/painel">Ir para o painel</Link>
      </Button>
    </div>
  );
}
