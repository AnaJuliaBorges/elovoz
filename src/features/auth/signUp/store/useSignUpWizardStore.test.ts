import { initialData, useSignUpWizardStore } from "./useSignUpWizardStore";

beforeEach(() => {
  useSignUpWizardStore.setState({ data: initialData });
  localStorage.clear();
});

describe("useSignUpWizardStore", () => {
  it("começa no passo 1 como doador e sem conta criada", () => {
    const { data } = useSignUpWizardStore.getState();

    expect(data.step).toBe(1);
    expect(data.account.user_type).toBe("donor");
    expect(data.userId).toBeNull();
  });

  it("avança e volta sem passar do passo 1", () => {
    const { nextStep, prevStep } = useSignUpWizardStore.getState();

    nextStep();
    nextStep();
    expect(useSignUpWizardStore.getState().data.step).toBe(3);

    prevStep();
    prevStep();
    prevStep();
    expect(useSignUpWizardStore.getState().data.step).toBe(1);
  });

  it("atualiza um pedaço do wizard sem apagar o resto", () => {
    const { update } = useSignUpWizardStore.getState();

    update("userId", "user-1");
    update("ongData", {
      trade_name: "Casa Solidária",
      legal_name: "Associação Casa Solidária",
      cnpj: "11222333000181",
      mission: "Distribuir alimentos para famílias em situação de rua.",
    });

    const { data } = useSignUpWizardStore.getState();

    expect(data.userId).toBe("user-1");
    expect(data.ongData?.trade_name).toBe("Casa Solidária");
    expect(data.account).toEqual(initialData.account);
  });

  it("volta ao estado inicial no reset", () => {
    const { update, nextStep, reset } = useSignUpWizardStore.getState();

    update("userId", "user-1");
    nextStep();
    reset();

    expect(useSignUpWizardStore.getState().data).toEqual(initialData);
  });

  it("nunca persiste a senha em claro no localStorage", () => {
    const { update } = useSignUpWizardStore.getState();

    update("account", {
      user_type: "ong",
      name: "Ana",
      email: "ana@exemplo.com",
      password: "senha-forte-1",
      passwordConfirmation: "senha-forte-1",
      phone: "",
    });

    const persisted = localStorage.getItem("signup_wizard") ?? "";

    expect(persisted).toContain("ana@exemplo.com");
    expect(persisted).not.toContain("senha-forte-1");
    // em memória a senha continua disponível para criar a conta
    expect(useSignUpWizardStore.getState().data.account.password).toBe(
      "senha-forte-1",
    );
  });
});
