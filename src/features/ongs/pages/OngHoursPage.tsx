import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button, Skeleton } from "@/components/ui";
import { BackButton } from "@/components/shared/BackButton";
import { OpeningHoursFields } from "../components/OpeningHoursFields";
import {
  useOngOpeningHours,
  useSaveOngOpeningHours,
} from "../hooks/useOngOpeningHours";
import { useMyOng } from "../hooks/useMyOng";
import {
  openingHoursErrors,
  openingHoursToRows,
  toOpeningHoursForm,
  type OpeningHour,
  type OpeningHoursFormInput,
} from "../model/openingHours";

/** Monta só com os horários já carregados — sem `reset()` tardio. */
function HoursForm({ ongId, saved }: { ongId: string; saved: OpeningHour[] }) {
  const [value, setValue] = useState<OpeningHoursFormInput>(() =>
    toOpeningHoursForm(saved),
  );
  const [errors, setErrors] = useState<Record<number, string>>({});

  const save = useSaveOngOpeningHours(ongId);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const found = openingHoursErrors(value);
    setErrors(found);

    if (Object.keys(found).length > 0) return;

    save.mutate(openingHoursToRows(value), {
      onSuccess: () => toast.success("Horários atualizados"),
      onError: () =>
        toast.error("Não foi possível salvar os horários. Tente de novo."),
    });
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
      <OpeningHoursFields
        value={value}
        onChange={setValue}
        disabled={save.isPending}
        errors={errors}
        hideLegend
      />

      <Button type="submit" disabled={save.isPending}>
        {save.isPending ? "Salvando..." : "Salvar horários"}
      </Button>
    </form>
  );
}

export default function OngHoursPage() {
  const { data: ong, isLoading: loadingOng } = useMyOng();
  const {
    data: hours,
    isLoading: loadingHours,
    isError,
    refetch,
  } = useOngOpeningHours(ong?.id);

  const loading = loadingOng || (!!ong && loadingHours);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div className="flex items-center gap-2">
        <BackButton />
        <h1 className="text-xl font-medium">Horários de funcionamento</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        É o que aparece no perfil público da instituição, para o doador saber
        quando procurar vocês.
      </p>

      {loading && <Skeleton className="h-96 w-full" />}

      {!loading && isError && (
        <div
          role="alert"
          className="flex flex-col items-start gap-2 rounded-md bg-destructive-light p-4 text-sm text-destructive"
        >
          Não foi possível carregar os horários.
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {!loading && !ong && (
        <p className="text-sm text-muted-foreground">
          Não encontramos os dados da sua instituição.{" "}
          <Link to="/painel" className="text-primary underline">
            Voltar ao painel
          </Link>
        </p>
      )}

      {!loading && !isError && ong && (
        <HoursForm ongId={ong.id} saved={hours ?? []} />
      )}
    </div>
  );
}
