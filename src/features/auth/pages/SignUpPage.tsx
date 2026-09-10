import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BackButton } from "@/components/shared/BackButton";
import { useSignUpWizardStore } from "../signUp/store/useSignUpWizardStore";
import {
  emptyOngContact,
  emptyOngData,
  useSignUpWizard,
} from "../signUp/hooks/useSignUpWizard";
import { AccountStep } from "../signUp/steps/AccountStep";
import { OngDataStep } from "../signUp/steps/OngDataStep";
import { OngContactStep } from "../signUp/steps/OngContactStep";
import { PendingReview } from "../signUp/steps/PendingReview";
import icone from "@/assets/icone.png";

const ONG_STEP_TITLES = [
  "Criar conta",
  "Dados da instituição",
  "Localização e contato",
];

export default function SignUpPage() {
  const {
    data,
    submitting,
    error,
    prevStep,
    submitAccount,
    submitOngData,
    submitOngContact,
  } = useSignUpWizard();
  const update = useSignUpWizardStore((state) => state.update);

  const isOng = data.account.user_type === "ong";

  // a senha não é persistida (de propósito): se a página foi recarregada no
  // meio do wizard, não dá pra criar a conta no fim — voltamos ao passo 1
  const passwordLost =
    data.step > 1 && data.step < 4 && !data.account.password && !data.userId;

  useEffect(() => {
    if (passwordLost) update("step", 1);
  }, [passwordLost, update]);

  const step = passwordLost ? 1 : data.step;

  if (step === 4) {
    return <PendingReview tradeName={data.ongData?.trade_name ?? "sua ONG"} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 py-6">
      <div className="flex items-center gap-2">
        <BackButton />
        <img src={icone} alt="Elovoz" className="h-9 w-auto" />
      </div>

      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-medium">
          {isOng ? ONG_STEP_TITLES[step - 1] : "Criar conta"}
        </h1>

        {isOng && (
          <p className="text-sm text-muted-foreground">Passo {step} de 3</p>
        )}
      </header>

      {passwordLost && (
        <p role="status" className="rounded-md bg-warning-light p-3 text-sm">
          A página foi recarregada e, por segurança, a senha não fica salva.
          Preencha os dados da conta de novo — o resto do cadastro continua
          guardado.
        </p>
      )}

      {step === 1 && (
        <AccountStep
          defaultValues={data.account}
          onSubmit={submitAccount}
          submitting={submitting}
          error={error}
        />
      )}

      {step === 2 && (
        <OngDataStep
          defaultValues={data.ongData ?? emptyOngData}
          onSubmit={submitOngData}
          onBack={prevStep}
        />
      )}

      {step === 3 && (
        <OngContactStep
          defaultValues={data.contact ?? emptyOngContact}
          onSubmit={submitOngContact}
          onBack={prevStep}
          submitting={submitting}
          error={error}
        />
      )}

      {step === 1 && (
        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary underline">
            Entrar
          </Link>
        </p>
      )}
    </div>
  );
}
