import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OpeningHoursFormInput } from "@/features/ongs";
import type {
  AccountFormInput,
  OngContactFormInput,
  OngDataFormInput,
} from "../../model/schema";

export interface SignUpWizardData {
  step: number;
  /** preenchido assim que a conta existe no Auth — permite retomar sem recriá-la */
  userId: string | null;
  account: AccountFormInput;
  ongData: OngDataFormInput | null;
  contact: OngContactFormInput | null;
  hours: OpeningHoursFormInput | null;
}

type SignUpWizardStore = {
  data: SignUpWizardData;
  update: <K extends keyof SignUpWizardData>(
    key: K,
    value: SignUpWizardData[K],
  ) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
};

export const initialData: SignUpWizardData = {
  step: 1,
  userId: null,
  account: {
    user_type: "donor",
    name: "",
    email: "",
    password: "",
    passwordConfirmation: "",
    phone: "",
  },
  ongData: null,
  contact: null,
  hours: null,
};

export const useSignUpWizardStore = create<SignUpWizardStore>()(
  persist(
    (set) => ({
      data: initialData,
      update: (key, value) =>
        set((state) => ({ data: { ...state.data, [key]: value } })),
      nextStep: () =>
        set((state) => ({ data: { ...state.data, step: state.data.step + 1 } })),
      prevStep: () =>
        set((state) => ({
          data: { ...state.data, step: Math.max(1, state.data.step - 1) },
        })),
      reset: () => set({ data: initialData }),
    }),
    {
      name: "signup_wizard",
      // a senha em claro nunca vai pro localStorage
      partialize: (state) => ({
        data: {
          ...state.data,
          account: {
            ...state.data.account,
            password: "",
            passwordConfirmation: "",
          },
        },
      }),
    },
  ),
);
