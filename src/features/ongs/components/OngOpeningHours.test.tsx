import { render, screen } from "@testing-library/react";
import { OngOpeningHours } from "./OngOpeningHours";

describe("OngOpeningHours", () => {
  it("mostra os dias agrupados", () => {
    render(
      <OngOpeningHours
        hours={[
          { weekday: 1, opens_at: "09:00:00", closes_at: "17:00:00" },
          { weekday: 2, opens_at: "09:00:00", closes_at: "17:00:00" },
          { weekday: 6, opens_at: "08:00:00", closes_at: "12:00:00" },
        ]}
      />,
    );

    expect(screen.getByText("Seg e Ter")).toBeInTheDocument();
    expect(screen.getByText("09:00 às 17:00")).toBeInTheDocument();
    expect(screen.getByText("Sáb")).toBeInTheDocument();
    expect(screen.getByText("08:00 às 12:00")).toBeInTheDocument();
  });

  it("avisa quando a ONG não informou nada", () => {
    render(<OngOpeningHours hours={[]} />);

    expect(
      screen.getByText(/ainda não informou os horários/),
    ).toBeInTheDocument();
  });
});
