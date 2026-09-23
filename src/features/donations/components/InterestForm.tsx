import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Field,
  FieldDescription,
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
          <FieldLabel htmlFor="message">Mensagem para a instituição</FieldLabel>
          <Textarea
            id="message"
            className="h-28"
            placeholder="O que você pode doar, em que estado está e como a instituição fala com você."
            {...register("message")}
          />
          <FieldDescription>
            A instituição lê esta mensagem — deixe aqui um telefone ou e-mail
            para ela combinar a entrega com você.
          </FieldDescription>
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

      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive-light p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Enviando..." : "Enviar interesse"}
        </Button>
      </div>
    </form>
  );
}
