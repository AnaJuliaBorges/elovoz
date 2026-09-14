import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button, Skeleton } from "@/components/ui";
import { useMyOng } from "@/features/ongs";
import { NeedForm } from "../components/NeedForm";
import { NeedPageShell } from "../components/NeedPageShell";
import { useCreateNeed } from "../hooks/useNeedMutations";
import { emptyNeedForm, type NeedFormInput } from "../model/schema";
import { needErrorMessage } from "../services/needs";

export default function CreateNeedPage() {
  const navigate = useNavigate();
  const { data: ong, isLoading } = useMyOng();
  const createNeed = useCreateNeed();

  if (isLoading) {
    return (
      <NeedPageShell title="Nova necessidade">
        <Skeleton className="h-96 w-full" />
      </NeedPageShell>
    );
  }

  // a RLS recusaria o INSERT de qualquer jeito; aqui só evitamos o form inútil
  if (ong?.verification_status !== "approved") {
    return (
      <NeedPageShell title="Nova necessidade">
        <p role="status" className="rounded-md bg-warning-light p-4 text-sm">
          Sua ONG precisa estar aprovada para publicar necessidades.
        </p>
        <Button variant="outline" asChild>
          <Link to="/painel">Voltar ao painel</Link>
        </Button>
      </NeedPageShell>
    );
  }

  async function handleSubmit(values: NeedFormInput) {
    try {
      await createNeed.mutateAsync({ ongId: ong!.id, values });
      toast.success("Necessidade publicada");
      navigate("/painel");
    } catch {
      // a mensagem aparece no form, a partir de `createNeed.error`
    }
  }

  return (
    <NeedPageShell title="Nova necessidade">
      <NeedForm
        defaultValues={emptyNeedForm}
        onSubmit={handleSubmit}
        submitting={createNeed.isPending}
        submitLabel="Publicar necessidade"
        error={createNeed.error ? needErrorMessage(createNeed.error) : null}
      />
    </NeedPageShell>
  );
}
