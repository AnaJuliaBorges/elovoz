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
import { formatCnpj } from "@/lib/masks";
import { ongDataSchema, type OngDataFormInput } from "../../model/schema";

export function OngDataStep({
  defaultValues,
  onSubmit,
  onBack,
}: {
  defaultValues: OngDataFormInput;
  onSubmit: (values: OngDataFormInput) => void;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OngDataFormInput>({
    resolver: zodResolver(ongDataSchema),
    defaultValues,
  });

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup className="flex flex-col gap-4">
        <Field>
          <FieldLabel htmlFor="trade_name">Nome fantasia</FieldLabel>
          <Input id="trade_name" {...register("trade_name")} />
          {errors.trade_name && <FieldError errors={[errors.trade_name]} />}
        </Field>

        <Field>
          <FieldLabel htmlFor="legal_name">Razão social</FieldLabel>
          <Input id="legal_name" {...register("legal_name")} />
          {errors.legal_name && <FieldError errors={[errors.legal_name]} />}
        </Field>

        <Field>
          <FieldLabel htmlFor="cnpj">CNPJ</FieldLabel>
          <Input
            id="cnpj"
            inputMode="numeric"
            placeholder="00.000.000/0000-00"
            {...register("cnpj", {
              onChange: (event) => {
                setValue("cnpj", formatCnpj(event.target.value));
              },
            })}
          />
          <FieldDescription>
            Usado pela nossa equipe para verificar a instituição.
          </FieldDescription>
          {errors.cnpj && <FieldError errors={[errors.cnpj]} />}
        </Field>

        <Field>
          <FieldLabel htmlFor="mission">Missão da ONG</FieldLabel>
          <Textarea id="mission" className="h-32" {...register("mission")} />
          {errors.mission && <FieldError errors={[errors.mission]} />}
        </Field>
      </FieldGroup>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button type="submit" className="flex-1">
          Continuar
        </Button>
      </div>
    </form>
  );
}
