import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  emptyOpeningHoursForm,
  type OpeningHoursFormInput,
} from "../model/openingHours";
import { OpeningHoursFields } from "./OpeningHoursFields";

/** envolve o componente controlado, como os formulários que o usam fazem */
function Harness({
  initial = emptyOpeningHoursForm,
  errors,
}: {
  initial?: OpeningHoursFormInput;
  errors?: Record<number, string>;
}) {
  const [value, setValue] = useState(initial);

  return (
    <>
      <OpeningHoursFields value={value} onChange={setValue} errors={errors} />
      <pre data-testid="estado">{JSON.stringify(value.days)}</pre>
    </>
  );
}

function state() {
  return JSON.parse(
    screen.getByTestId("estado").textContent!,
  ) as OpeningHoursFormInput["days"];
}

describe("OpeningHoursFields", () => {
  it("começa com os sete dias fechados, da segunda ao domingo", () => {
    render(<Harness />);

    expect(screen.getAllByText("Fechado")).toHaveLength(7);
    expect(state().map((day) => day.weekday)).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });

  it("abre um dia e guarda o horário digitado", async () => {
    render(<Harness />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("checkbox", { name: "Segunda" }));
    await user.type(screen.getByLabelText("Segunda: abre às"), "09:00");
    await user.type(screen.getByLabelText("Segunda: fecha às"), "17:00");

    expect(state()[0]).toEqual({
      weekday: 1,
      open: true,
      opens_at: "09:00",
      closes_at: "17:00",
    });
  });

  it("repete o primeiro horário de segunda a sexta, sem tocar no fim de semana", async () => {
    render(<Harness />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("checkbox", { name: "Quarta" }));
    await user.type(screen.getByLabelText("Quarta: abre às"), "08:00");
    await user.type(screen.getByLabelText("Quarta: fecha às"), "12:00");
    await user.click(
      screen.getByRole("button", {
        name: "Repetir o primeiro horário de segunda a sexta",
      }),
    );

    const days = state();

    expect(days.filter((day) => day.open)).toHaveLength(5);
    expect(days[0]).toMatchObject({
      weekday: 1,
      opens_at: "08:00",
      closes_at: "12:00",
    });
    // sábado e domingo continuam fechados
    expect(days[5].open).toBe(false);
    expect(days[6].open).toBe(false);
  });

  it("fecha o dia de novo quando desmarca", async () => {
    render(<Harness />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("checkbox", { name: "Sábado" }));
    expect(state()[5].open).toBe(true);

    await user.click(screen.getByRole("checkbox", { name: "Sábado" }));
    expect(state()[5].open).toBe(false);
  });

  it("mostra o erro do dia", () => {
    render(<Harness errors={{ 1: "Confira o horário" }} />);

    expect(screen.getByText("Confira o horário")).toBeInTheDocument();
  });
});
