import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MyDonationsPage from "./MyDonationsPage";

vi.mock("@/features/ongs", () => ({
  FollowedOngsList: () => <p>lista de ONGs seguidas</p>,
}));
vi.mock("../components/MyInterestsList", () => ({
  MyInterestsList: () => <p>lista de interesses</p>,
}));

describe("MyDonationsPage", () => {
  it("abre nos interesses e troca para as ONGs seguidas", async () => {
    render(<MyDonationsPage />);
    const user = userEvent.setup();

    expect(screen.getByText("lista de interesses")).toBeInTheDocument();
    expect(
      screen.queryByText("lista de ONGs seguidas"),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("tab", { name: "Instituições que sigo" }),
    );

    expect(screen.getByText("lista de ONGs seguidas")).toBeInTheDocument();
  });
});
