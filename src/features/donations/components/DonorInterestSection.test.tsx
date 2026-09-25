import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { AuthRequiredDialog, useProfile } from "@/features/auth";
import { useMyInterest } from "../hooks/useInterests";
import {
  useCreateInterest,
  useDeleteInterest,
} from "../hooks/useInterestMutations";
import type { Interest } from "../model/interest";
import { DonorInterestSection } from "./DonorInterestSection";

vi.mock("@/features/auth");
vi.mock("../hooks/useInterests");
vi.mock("../hooks/useInterestMutations");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const interest: Interest = {
  id: "interest-1",
  need_id: "need-1",
  donor_id: "donor-1",
  message: "Tenho 10 cestas, falo pelo (21) 99999-1234",
  expected_quantity: 10,
  expected_deadline: "2026-12-20",
  created_at: "2026-09-20T12:00:00Z",
  share_contact: false,
  contact_name: null,
  contact_email: null,
  contact_phone: null,
  answered_at: null,
};

function setup({
  userType = "donor" as "donor" | "ong" | "admin" | null,
  mine = null as Interest | null,
  isLoading = false,
  accepting = true,
  createFails = false,
} = {}) {
  vi.mocked(useProfile).mockReturnValue({
    data: userType === null ? null : { user_type: userType },
  } as never);
  vi.mocked(useMyInterest).mockReturnValue({
    data: mine,
    isLoading,
  } as never);

  const create = vi.fn(async () => {
    if (createFails) throw { code: "42501" };
  });
  const remove = vi.fn();

  vi.mocked(useCreateInterest).mockReturnValue({
    mutateAsync: create,
    isPending: false,
    error: createFails ? { code: "42501" } : null,
  } as never);
  vi.mocked(useDeleteInterest).mockReturnValue({
    mutate: remove,
    isPending: false,
  } as never);

  render(<DonorInterestSection needId="need-1" accepting={accepting} />);

  return { create, remove };
}

beforeAll(() => {
  // o AlertDialog do Radix usa APIs de ponteiro que o jsdom não implementa
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthDialog();
});

// o diálogo de cadastro tem teste próprio: aqui só importa que o botão abre
// o convite com o título certo
function mockAuthDialog() {
  vi.mocked(AuthRequiredDialog).mockImplementation(({ trigger, title }) => (
    <div>
      {trigger}
      <p>convite: {title}</p>
    </div>
  ));
}


describe("DonorInterestSection", () => {
  it("manifesta interesse com mensagem, quantidade e prazo", async () => {
    const { create } = setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /Tenho interesse/ }));

    await user.type(
      screen.getByLabelText(/Mensagem para a instituição/),
      "Tenho 10 cestas, falo pelo (21) 99999-1234",
    );
    await user.type(screen.getByLabelText("Quantidade (opcional)"), "10");
    await user.click(screen.getByRole("button", { name: "Enviar interesse" }));

    expect(create).toHaveBeenCalledWith({
      message: "Tenho 10 cestas, falo pelo (21) 99999-1234",
      expected_quantity: "10",
      expected_deadline: "",
      share_contact: false,
    });
    expect(toast.success).toHaveBeenCalledWith(
      "Interesse enviado para a instituição",
    );
  });

  it("envia sem mensagem, para quem só vai levar a doação", async () => {
    const { create } = setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /Tenho interesse/ }));
    await user.click(screen.getByRole("button", { name: "Enviar interesse" }));

    expect(create).toHaveBeenCalledWith({
      message: "",
      expected_quantity: "",
      expected_deadline: "",
      share_contact: false,
    });
  });

  it("aceita a data digitada no formato brasileiro, com a máscara", async () => {
    const { create } = setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /Tenho interesse/ }));

    const deadline = screen.getByLabelText("Até quando (opcional)");
    await user.type(deadline, "20122099");
    expect(deadline).toHaveValue("20/12/2099");

    await user.click(screen.getByRole("button", { name: "Enviar interesse" }));

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ expected_deadline: "20/12/2099" }),
    );
  });

  it("compartilha o contato só quando o doador marca", async () => {
    const { create } = setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /Tenho interesse/ }));

    const share = screen.getByRole("checkbox", {
      name: /Compartilhar meu nome, e-mail e telefone/,
    });
    expect(share).not.toBeChecked();

    await user.click(share);
    await user.click(screen.getByRole("button", { name: "Enviar interesse" }));

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ share_contact: true }),
    );
  });

  it("mostra a recusa da RLS no formulário", async () => {
    setup({ createFails: true });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /Tenho interesse/ }));

    expect(screen.getByRole("alert")).toHaveTextContent(/conta de doador/);
  });

  it("mostra o que já foi enviado em vez do convite", () => {
    setup({ mine: interest });

    expect(
      screen.getByRole("heading", { name: /Você manifestou interesse/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(interest.message!)).toBeInTheDocument();
    expect(screen.getByText("Quantidade: 10")).toBeInTheDocument();
    expect(screen.getByText("Até 20/12/2026")).toBeInTheDocument();
    expect(
      screen.getByText("Seu contato não foi compartilhado com a instituição."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Tenho interesse/ }),
    ).not.toBeInTheDocument();
  });

  it("lembra quando o contato foi compartilhado", () => {
    setup({ mine: { ...interest, share_contact: true } });

    expect(
      screen.getByText(/Você compartilhou seu nome, e-mail e telefone/),
    ).toBeInTheDocument();
  });

  it("cancela o interesse depois de confirmar", async () => {
    const { remove } = setup({ mine: interest });
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: "Cancelar interesse" }),
    );

    const dialog = screen.getByRole("alertdialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Cancelar interesse" }),
    );

    expect(remove).toHaveBeenCalledWith("interest-1", expect.anything());
  });

  it("não convida a doar quando a necessidade não aceita mais", () => {
    setup({ accepting: false });

    expect(
      screen.queryByRole("button", { name: /Tenho interesse/ }),
    ).not.toBeInTheDocument();
  });

  it("mostra o interesse já enviado mesmo com a necessidade fechada", () => {
    setup({ mine: interest, accepting: false });

    expect(
      screen.getByRole("heading", { name: /Você manifestou interesse/ }),
    ).toBeInTheDocument();
  });

  it("não aparece para quem não é doador, e nem consulta o interesse", () => {
    setup({ userType: "ong" });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(useMyInterest).toHaveBeenCalledWith("need-1", { enabled: false });
  });

  it("para o visitante, o Tenho interesse convida a criar conta", () => {
    setup({ userType: null });

    expect(
      screen.getByRole("button", { name: "Tenho interesse" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("convite: Crie sua conta para doar"),
    ).toBeInTheDocument();
  });

  it("não convida o visitante quando a necessidade não aceita mais", () => {
    setup({ userType: null, accepting: false });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
