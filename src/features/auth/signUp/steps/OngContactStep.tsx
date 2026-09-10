import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import {
  Button,
  Checkbox,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "@/components/ui";
import { LocationFields } from "@/components/shared/LocationFields";
import { formatPhone } from "@/lib/masks";
import { ongContactSchema, type OngContactFormInput } from "../../model/schema";

export function OngContactStep({
  defaultValues,
  onSubmit,
  onBack,
  submitting,
  error,
}: {
  defaultValues: OngContactFormInput;
  onSubmit: (values: OngContactFormInput) => void | Promise<void>;
  onBack: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OngContactFormInput>({
    resolver: zodResolver(ongContactSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "contacts",
  });

  const contacts = useWatch({ control, name: "contacts" });

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup className="flex flex-col gap-4">
        <LocationFields control={control} />

        <Field>
          <FieldLabel htmlFor="neighborhood">Bairro</FieldLabel>
          <Input id="neighborhood" {...register("neighborhood")} />
          {errors.neighborhood && <FieldError errors={[errors.neighborhood]} />}
        </Field>

        <Field>
          <FieldLabel htmlFor="address">Endereço</FieldLabel>
          <Input
            id="address"
            placeholder="Rua, número e complemento"
            {...register("address")}
          />
          {errors.address && <FieldError errors={[errors.address]} />}
        </Field>
      </FieldGroup>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 font-medium">Telefones</legend>

        {fields.map((field, index) => (
          <div key={field.id} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Input
                inputMode="tel"
                aria-label={`Telefone ${index + 1}`}
                placeholder="(00) 00000-0000"
                {...register(`contacts.${index}.number` as const, {
                  onChange: (event) => {
                    setValue(
                      `contacts.${index}.number` as const,
                      formatPhone(event.target.value),
                    );
                  },
                })}
              />

              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover telefone ${index + 1}`}
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={contacts?.[index]?.whatsapp ?? false}
                onCheckedChange={(checked) =>
                  setValue(`contacts.${index}.whatsapp` as const, checked === true)
                }
              />
              Recebe WhatsApp
            </label>

            {errors.contacts?.[index]?.number && (
              <FieldError errors={[errors.contacts[index]?.number]} />
            )}
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() => append({ number: "", whatsapp: false })}
        >
          <Plus className="size-4" />
          Adicionar telefone
        </Button>

        {errors.contacts?.root && <FieldError errors={[errors.contacts.root]} />}
      </fieldset>

      <FieldGroup className="flex flex-col gap-4">
        <Field>
          <FieldLabel htmlFor="instagram">Instagram (opcional)</FieldLabel>
          <Input id="instagram" placeholder="@suaong" {...register("instagram")} />
        </Field>

        <Field>
          <FieldLabel htmlFor="facebook">Facebook (opcional)</FieldLabel>
          <Input id="facebook" {...register("facebook")} />
        </Field>

        <Field>
          <FieldLabel htmlFor="website">Site (opcional)</FieldLabel>
          <Input
            id="website"
            placeholder="https://"
            {...register("website")}
          />
          <FieldDescription>
            Links ajudam nossa equipe a verificar a instituição mais rápido.
          </FieldDescription>
          {errors.website && <FieldError errors={[errors.website]} />}
        </Field>
      </FieldGroup>

      {error && (
        <p role="alert" className="rounded-md bg-destructive-light p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button type="submit" className="flex-1" disabled={submitting}>
          {submitting ? "Enviando..." : "Enviar cadastro"}
        </Button>
      </div>
    </form>
  );
}
