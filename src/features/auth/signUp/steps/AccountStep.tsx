import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HandHeart, Building2 } from "lucide-react";
import {
  Button,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatPhone } from "@/lib/masks";
import { accountSchema, type AccountFormInput } from "../../model/schema";

const ROLES = [
  {
    value: "donor",
    icon: HandHeart,
    title: "Quero doar",
    description: "Veja necessidades e ofereça sua doação",
  },
  {
    value: "ong",
    icon: Building2,
    title: "Sou uma ONG",
    description: "Divulgue o que sua instituição precisa",
  },
] as const;

export function AccountStep({
  defaultValues,
  onSubmit,
  submitting,
  error,
}: {
  defaultValues: AccountFormInput;
  onSubmit: (values: AccountFormInput) => void | Promise<void>;
  submitting: boolean;
  error: string | null;
}) {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AccountFormInput>({
    resolver: zodResolver(accountSchema),
    defaultValues,
  });

  const userType = useWatch({ control, name: "user_type" });

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
      <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <legend className="sr-only">Tipo de conta</legend>

        {ROLES.map((role) => {
          const Icon = role.icon;
          const selected = userType === role.value;

          return (
            <label
              key={role.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                selected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40",
              )}
            >
              <input
                type="radio"
                value={role.value}
                className="sr-only"
                checked={selected}
                onChange={() => setValue("user_type", role.value)}
              />
              <Icon
                className={cn(
                  "mt-0.5 size-5 shrink-0",
                  selected ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span>
                <span className="block font-medium">{role.title}</span>
                <span className="block text-sm text-muted-foreground">
                  {role.description}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <FieldGroup className="flex flex-col gap-4">
        <Field>
          <FieldLabel htmlFor="name">
            {userType === "ong" ? "Nome do responsável" : "Nome completo"}
          </FieldLabel>
          <Input id="name" {...register("name")} autoComplete="name" />
          {errors.name && <FieldError errors={[errors.name]} />}
        </Field>

        <Field>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && <FieldError errors={[errors.email]} />}
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

        <Field>
          <FieldLabel htmlFor="password">Senha</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password && <FieldError errors={[errors.password]} />}
        </Field>

        <Field>
          <FieldLabel htmlFor="passwordConfirmation">Repita a senha</FieldLabel>
          <Input
            id="passwordConfirmation"
            type="password"
            autoComplete="new-password"
            {...register("passwordConfirmation")}
          />
          {errors.passwordConfirmation && (
            <FieldError errors={[errors.passwordConfirmation]} />
          )}
        </Field>
      </FieldGroup>

      {error && (
        <p role="alert" className="rounded-md bg-destructive-light p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting
          ? "Criando conta..."
          : userType === "ong"
            ? "Continuar"
            : "Criar conta"}
      </Button>
    </form>
  );
}
