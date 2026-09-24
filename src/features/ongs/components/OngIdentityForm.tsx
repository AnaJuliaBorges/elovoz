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
import {
  ongIdentitySchema,
  type OngIdentityFormInput,
} from "../model/ongForm";

/**
 * Nome fantasia e missão, editáveis. Razão social e CNPJ aparecem travados:
 * são o que o admin conferiu para aprovar a ONG.
 */
export function OngIdentityForm({
  defaultValues,
  legalName,
  cnpj,
  onSubmit,
  submitting = false,
}: {
  defaultValues: OngIdentityFormInput;
  legalName: string;
  cnpj: string;
  onSubmit: (values: OngIdentityFormInput) => void;
  submitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OngIdentityFormInput>({
    resolver: zodResolver(ongIdentitySchema),
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="legal_name">Razão social</FieldLabel>
            <Input id="legal_name" value={legalName} readOnly disabled />
          </Field>

          <Field>
            <FieldLabel htmlFor="cnpj">CNPJ</FieldLabel>
            <Input id="cnpj" value={formatCnpj(cnpj)} readOnly disabled />
          </Field>
        </div>
        <FieldDescription>
          Razão social e CNPJ foram verificados pela equipe do Elovoz. Para
          corrigir, fale com a equipe.
        </FieldDescription>

        <Field>
          <FieldLabel htmlFor="mission">Missão da ONG</FieldLabel>
          <Textarea id="mission" className="h-32" {...register("mission")} />
          {errors.mission && <FieldError errors={[errors.mission]} />}
        </Field>
      </FieldGroup>

      <Button type="submit" className="self-start" disabled={submitting}>
        {submitting ? "Salvando..." : "Salvar identificação"}
      </Button>
    </form>
  );
}
