import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/utils";
import { registerDonor, registerOng, SignUpError } from "../../services/signUp";
import { PROFILE_QUERY_KEY } from "../../hooks/useProfile";
import { homeFor } from "../../model/profile";
import type {
  AccountFormInput,
  OngContactFormInput,
  OngDataFormInput,
} from "../../model/schema";
import { useSignUpWizardStore } from "../store/useSignUpWizardStore";

export const emptyOngData: OngDataFormInput = {
  trade_name: "",
  legal_name: "",
  cnpj: "",
  mission: "",
};

export const emptyOngContact: OngContactFormInput = {
  state_id: "",
  city_id: "",
  neighborhood: "",
  address: "",
  contacts: [{ number: "", whatsapp: false }],
  instagram: "",
  facebook: "",
  website: "",
};

function messageFor(error: unknown): string {
  if (error instanceof SignUpError) return error.message;
  return getErrorMessage(error) ?? "Algo deu errado. Tente novamente.";
}

export function useSignUpWizard() {
  const data = useSignUpWizardStore((state) => state.data);
  const update = useSignUpWizardStore((state) => state.update);
  const nextStep = useSignUpWizardStore((state) => state.nextStep);
  const prevStep = useSignUpWizardStore((state) => state.prevStep);
  const reset = useSignUpWizardStore((state) => state.reset);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** só reaproveita a conta já criada se for o mesmo e-mail da tentativa anterior */
  const existingUserId = data.userId ?? undefined;

  async function submitAccount(values: AccountFormInput) {
    update("account", values);
    setError(null);

    if (values.user_type === "ong") {
      nextStep();
      return;
    }

    setSubmitting(true);

    try {
      const userId = await registerDonor(values, existingUserId);

      update("userId", userId);
      await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      reset();
      navigate(homeFor("donor"), { replace: true });
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setSubmitting(false);
    }
  }

  function submitOngData(values: OngDataFormInput) {
    update("ongData", values);
    setError(null);
    nextStep();
  }

  async function submitOngContact(values: OngContactFormInput) {
    update("contact", values);
    setError(null);
    setSubmitting(true);

    try {
      const userId = await registerOng({
        account: data.account,
        data: data.ongData ?? emptyOngData,
        contact: values,
        existingUserId,
      });

      update("userId", userId);
      await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      nextStep();
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setSubmitting(false);
    }
  }

  return {
    data,
    submitting,
    error,
    prevStep,
    reset,
    submitAccount,
    submitOngData,
    submitOngContact,
  };
}
