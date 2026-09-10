import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "@/components/ui";
import { loginSchema, type LoginFormInput } from "../model/schema";
import { useLogin } from "../hooks/useLogin";
import logo from "@/assets/logo.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormInput) {
    try {
      const home = await login(values);
      navigate(home, { replace: true });
    } catch {
      // a mensagem já vem tratada em `error`
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-8 py-10">
      <img src={logo} alt="Elovoz" className="mx-auto h-24 w-auto" />

      <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup className="flex flex-col gap-4">
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
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password && <FieldError errors={[errors.password]} />}
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

        <Button type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="flex flex-col items-center gap-2 text-sm">
        <Link to="/recuperar-senha" className="text-muted-foreground underline">
          Esqueci minha senha
        </Link>

        <p className="text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link to="/cadastrar" className="text-primary underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
