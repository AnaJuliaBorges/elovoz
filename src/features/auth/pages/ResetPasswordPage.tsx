import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Button,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "@/components/ui";
import { getErrorMessage } from "@/lib/utils";
import {
  resetPasswordSchema,
  type ResetPasswordFormInput,
} from "../model/schema";
import { updatePassword } from "../services/passwordReset";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", passwordConfirmation: "" },
  });

  async function onSubmit(values: ResetPasswordFormInput) {
    setError(null);

    try {
      await updatePassword(values.password);
      toast.success("Senha atualizada!");
      navigate("/login", { replace: true });
    } catch (err) {
      setError(
        getErrorMessage(err) ??
          "Não foi possível atualizar a senha. Peça um novo link.",
      );
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 py-10">
      <h1 className="text-xl font-medium">Criar nova senha</h1>

      <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="password">Nova senha</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && <FieldError errors={[errors.password]} />}
          </Field>

          <Field>
            <FieldLabel htmlFor="passwordConfirmation">
              Repita a nova senha
            </FieldLabel>
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
          <p
            role="alert"
            className="rounded-md bg-destructive-light p-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar senha"}
        </Button>
      </form>
    </div>
  );
}
