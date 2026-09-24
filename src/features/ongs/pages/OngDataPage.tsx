import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button, Skeleton } from "@/components/ui";
import { BackButton } from "@/components/shared/BackButton";
import { OngContactForm } from "../components/OngContactForm";
import { OngIdentityForm } from "../components/OngIdentityForm";
import { useMyOng } from "../hooks/useMyOng";
import {
  useOngForEdit,
  useUpdateOngContact,
  useUpdateOngIdentity,
} from "../hooks/useOngData";
import { toOngForms } from "../model/ongForm";
import type { OngEditable } from "../model/ong";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border bg-surface p-4">
      <h2 className="font-medium">{title}</h2>
      {children}
    </section>
  );
}

/** Monta só com a ONG já carregada — sem `reset()` tardio. */
function OngDataForms({ ong }: { ong: OngEditable }) {
  const forms = toOngForms(ong);
  const updateIdentity = useUpdateOngIdentity(ong.id);
  const updateContact = useUpdateOngContact(ong.id);

  const onError = () =>
    toast.error("Não foi possível salvar. Tente de novo.");

  return (
    <>
      <Section title="Identificação">
        <OngIdentityForm
          defaultValues={forms.identity}
          legalName={ong.legal_name}
          cnpj={ong.cnpj}
          submitting={updateIdentity.isPending}
          onSubmit={(values) =>
            updateIdentity.mutate(values, {
              onSuccess: () => toast.success("Identificação atualizada"),
              onError,
            })
          }
        />
      </Section>

      <Section title="Endereço e contatos">
        <OngContactForm
          defaultValues={forms.contact}
          submitLabel={
            updateContact.isPending
              ? "Salvando..."
              : "Salvar endereço e contatos"
          }
          submitting={updateContact.isPending}
          onSubmit={(values) =>
            updateContact.mutate(values, {
              onSuccess: () => toast.success("Endereço e contatos atualizados"),
              onError,
            })
          }
        />
      </Section>
    </>
  );
}

/** `/painel/dados`: a ONG edita o que o perfil público mostra (RF05). */
export default function OngDataPage() {
  const { data: myOng, isLoading: loadingMyOng } = useMyOng();
  const {
    data: ong,
    isLoading: loadingOng,
    isError,
    refetch,
  } = useOngForEdit(myOng?.id);

  const loading = loadingMyOng || (!!myOng && loadingOng);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div className="flex items-center gap-2">
        <BackButton />
        <h1 className="text-xl font-medium">Dados da instituição</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        É o que aparece no perfil público da instituição.
      </p>

      {loading && <Skeleton className="h-96 w-full" />}

      {!loading && isError && (
        <div
          role="alert"
          className="flex flex-col items-start gap-2 rounded-md bg-destructive-light p-4 text-sm text-destructive"
        >
          Não foi possível carregar os dados da instituição.
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {!loading && !isError && !ong && (
        <p className="text-sm text-muted-foreground">
          Não encontramos os dados da sua instituição.{" "}
          <Link to="/painel" className="text-primary underline">
            Voltar ao painel
          </Link>
        </p>
      )}

      {!loading && !isError && ong && <OngDataForms ong={ong} />}
    </div>
  );
}
