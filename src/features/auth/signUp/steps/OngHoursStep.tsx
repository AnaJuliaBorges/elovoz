import { useState } from "react";
import { Button } from "@/components/ui";
import {
  OpeningHoursFields,
  openingHoursErrors,
  type OpeningHoursFormInput,
} from "@/features/ongs";

/**
 * Último passo do cadastro de ONG. Os horários são opcionais — quem não marcar
 * nenhum dia segue em frente e preenche depois, no painel.
 */
export function OngHoursStep({
  defaultValues,
  onSubmit,
  onBack,
  submitting,
  error,
}: {
  defaultValues: OpeningHoursFormInput;
  onSubmit: (values: OpeningHoursFormInput) => void | Promise<void>;
  onBack: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const [value, setValue] = useState(defaultValues);
  const [errors, setErrors] = useState<Record<number, string>>({});

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const found = openingHoursErrors(value);

    setErrors(found);
    if (Object.keys(found).length === 0) onSubmit(value);
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
      <p className="text-sm text-muted-foreground">
        Quando os doadores podem procurar a instituição para entregar uma
        doação? Dá para deixar em branco agora e preencher depois, no painel.
      </p>

      <OpeningHoursFields
        value={value}
        onChange={setValue}
        disabled={submitting}
        errors={errors}
      />

      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive-light p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={submitting}
        >
          Voltar
        </Button>
        <Button type="submit" className="flex-1" disabled={submitting}>
          {submitting ? "Enviando..." : "Enviar cadastro"}
        </Button>
      </div>
    </form>
  );
}
