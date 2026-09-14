import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button, Skeleton } from "@/components/ui";
import { useMyOng } from "@/features/ongs";
import { NeedForm } from "../components/NeedForm";
import { NeedPageShell } from "../components/NeedPageShell";
import { useNeed } from "../hooks/useNeedQueries";
import { useUpdateNeed } from "../hooks/useNeedMutations";
import type { NeedWithOng } from "../model/need";
import { needToForm, type NeedFormInput } from "../model/schema";
import { needErrorMessage } from "../services/needs";

function EditNeedForm({ need }: { need: NeedWithOng }) {
  const navigate = useNavigate();
  const updateNeed = useUpdateNeed();

  async function handleSubmit(values: NeedFormInput) {
    try {
      await updateNeed.mutateAsync({ id: need.id, values });
      toast.success("Necessidade atualizada");
      navigate("/painel");
    } catch {
      // a mensagem aparece no form, a partir de `updateNeed.error`
    }
  }

  return (
    <NeedForm
      defaultValues={needToForm(need)}
      onSubmit={handleSubmit}
      submitting={updateNeed.isPending}
      submitLabel="Salvar alterações"
      error={updateNeed.error ? needErrorMessage(updateNeed.error) : null}
    />
  );
}

export default function EditNeedPage() {
  const { id = "" } = useParams();
  const { data: need, isLoading: loadingNeed } = useNeed(id);
  const { data: ong, isLoading: loadingOng } = useMyOng();

  if (loadingNeed || loadingOng) {
    return (
      <NeedPageShell title="Editar necessidade">
        <Skeleton className="h-96 w-full" />
      </NeedPageShell>
    );
  }

  // a busca deixa qualquer um ler necessidades de ONGs aprovadas: sem essa
  // checagem, uma ONG abriria o form de outra (e só a RLS barraria no salvar)
  if (!need || !ong || need.ong_id !== ong.id) {
    return (
      <NeedPageShell title="Editar necessidade">
        <p className="text-sm text-muted-foreground">
          Não encontramos essa necessidade entre as da sua ONG.
        </p>
        <Button variant="outline" asChild>
          <Link to="/painel">Voltar ao painel</Link>
        </Button>
      </NeedPageShell>
    );
  }

  return (
    <NeedPageShell title="Editar necessidade">
      <EditNeedForm need={need} />
    </NeedPageShell>
  );
}
