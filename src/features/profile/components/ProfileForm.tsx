import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Button,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "@/components/ui";
import { formatPhone } from "@/lib/masks";
import type { Profile } from "@/features/auth";
import { useUpdateProfile } from "../hooks/useAccount";
import { profileSchema, type ProfileFormInput } from "../model/schema";

/** Monta só com o perfil já carregado — sem `reset()` tardio. */
export function ProfileForm({
  profile,
  email,
}: {
  profile: Profile;
  email: string | null;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile.name,
      phone: profile.phone ? formatPhone(profile.phone) : "",
    },
  });

  const update = useUpdateProfile(profile.id);

  function onSubmit(values: ProfileFormInput) {
    update.mutate(values, {
      onSuccess: () => {
        // o que acabou de ser salvo vira o novo "limpo" do formulário
        reset(values);
        toast.success("Dados atualizados");
      },
      onError: () =>
        toast.error("Não foi possível salvar seus dados. Tente de novo."),
    });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup className="flex flex-col gap-4">
        <Field>
          <FieldLabel htmlFor="name">
            {profile.user_type === "ong"
              ? "Nome do responsável"
              : "Nome completo"}
          </FieldLabel>
          <Input id="name" autoComplete="name" {...register("name")} />
          {errors.name && <FieldError errors={[errors.name]} />}
        </Field>

        <Field>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input id="email" value={email ?? ""} readOnly disabled />
        </Field>

        <Field>
          <FieldLabel htmlFor="phone">Telefone (opcional)</FieldLabel>
          <Input
            id="phone"
            inputMode="tel"
            autoComplete="tel"
            {...register("phone", {
              onChange: (event) => {
                setValue("phone", formatPhone(event.target.value));
              },
            })}
          />
          {errors.phone && <FieldError errors={[errors.phone]} />}
        </Field>
      </FieldGroup>

      <Button
        type="submit"
        className="self-start"
        disabled={!isDirty || update.isPending}
      >
        {update.isPending ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
