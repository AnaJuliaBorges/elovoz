import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Checkbox,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Textarea,
} from "@/components/ui";
import { todayIso } from "@/lib/dates";
import {
  emptyInterestForm,
  interestSchema,
  type InterestFormInput,
} from "../model/schema";

export function InterestForm({
  onSubmit,
  onCancel,
  submitting,
  error,
}: {
  onSubmit: (values: InterestFormInput) => void | Promise<void>;
  onCancel: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InterestFormInput>({
    resolver: zodResolver(interestSchema),
    defaultValues: emptyInterestForm,
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <FieldGroup className="flex flex-col gap-4">
        <Field>
          <FieldLabel htmlFor="message">
            Mensagem para a instituição (opcional)
          </FieldLabel>
          <Textarea
            id="message"
            className="h-28"
            placeholder="Vai levar no horário de funcionamento? Pode enviar sem mensagem."
            {...register("message")}
          />
          {errors.message && <FieldError errors={[errors.message]} />}
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="expected_quantity">
              Quantidade (opcional)
            </FieldLabel>
            <Input
              id="expected_quantity"
              inputMode="numeric"
              placeholder="Ex.: 10"
              {...register("expected_quantity")}
            />
            {errors.expected_quantity && (
              <FieldError errors={[errors.expected_quantity]} />
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="expected_deadline">
              Até quando (opcional)
            </FieldLabel>
            <Input
              id="expected_deadline"
              type="date"
              min={todayIso()}
              {...register("expected_deadline")}
            />
            {errors.expected_deadline && (
              <FieldError errors={[errors.expected_deadline]} />
            )}
          </Field>
        </div>
      </FieldGroup>

      <Controller
        control={control}
        name="share_contact"
        render={({ field }) => (
          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              className="mt-0.5"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
            <span className="flex flex-col gap-0.5">
              <span className="font-medium">
                Compartilhar meu nome, e-mail e telefone com a instituição
              </span>
              <span className="text-muted-foreground">
                Para ela combinar a entrega com você. Vale só para este
                interesse e some se você cancelar.
              </span>
            </span>
          </label>
        )}
      />

      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive-light p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {/* "Cancelar" sem borda: só fecha o formulário, não compete com enviar */}
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-sm"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          size="sm"
          className="text-sm"
          disabled={submitting}
        >
          {submitting ? "Enviando..." : "Enviar interesse"}
        </Button>
      </div>
    </form>
  );
}
