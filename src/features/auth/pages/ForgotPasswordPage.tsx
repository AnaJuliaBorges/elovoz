import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
} from "@/components/ui";
import { BackButton } from "@/components/shared/BackButton";
import { getErrorMessage } from "@/lib/utils";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormInput,
} from "../model/schema";
import { requestPasswordReset } from "../services/passwordReset";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordFormInput) {
    setError(null);

    try {
      await requestPasswordReset(values.email);
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err) ?? "Não foi possível enviar o e-mail.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 py-10">
      <div className="flex items-center gap-2">
        <BackButton />
        <h1 className="text-xl font-medium">Recuperar senha</h1>
      </div>

      {sent ? (
        <div className="flex flex-col gap-4">
          <p role="status" className="rounded-md bg-success-light p-3 text-sm">
            Se existir uma conta com esse e-mail, enviamos um link para
            redefinir a senha. Confira também a caixa de spam.
          </p>

          <Button asChild variant="outline">
            <Link to="/login">Voltar para o login</Link>
          </Button>
        </div>
      ) : (
        <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
          <Field>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
            />
            <FieldDescription>
              Enviamos um link para você criar uma nova senha.
            </FieldDescription>
            {errors.email && <FieldError errors={[errors.email]} />}
          </Field>

          {error && (
            <p
              role="alert"
              className="rounded-md bg-destructive-light p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar link"}
          </Button>
        </form>
      )}
    </div>
  );
}
