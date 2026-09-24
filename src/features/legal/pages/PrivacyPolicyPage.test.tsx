import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  CONTACT_EMAIL,
  PRIVACY_POLICY_UPDATED_AT,
} from "../model/privacy";
import PrivacyPolicyPage from "./PrivacyPolicyPage";

function setup() {
  render(
    <MemoryRouter>
      <PrivacyPolicyPage />
    </MemoryRouter>,
  );
}

describe("PrivacyPolicyPage", () => {
  it("mostra a política com a data de atualização", () => {
    setup();

    expect(
      screen.getByRole("heading", { level: 1, name: "Política de privacidade" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Atualizada em ${PRIVACY_POLICY_UPDATED_AT}`),
    ).toBeInTheDocument();
  });

  it("traz o contato do responsável pelos dados", () => {
    setup();

    expect(screen.getByRole("link", { name: CONTACT_EMAIL })).toHaveAttribute(
      "href",
      `mailto:${CONTACT_EMAIL}`,
    );
  });

  it("cobre o que a LGPD pede", () => {
    setup();

    for (const title of [
      "Quem cuida dos seus dados",
      "Quais dados coletamos",
      "Para que usamos",
      "Quem vê o quê",
      "Onde os dados ficam",
      "Por quanto tempo",
      "Seus direitos",
    ]) {
      expect(
        screen.getByRole("heading", { level: 2, name: title }),
      ).toBeInTheDocument();
    }
  });
});
