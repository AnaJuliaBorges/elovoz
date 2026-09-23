import { Checkbox, FieldError, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  WEEKDAY_LABELS,
  type OpeningHoursDay,
  type OpeningHoursFormInput,
  type Weekday,
} from "../model/openingHours";

/**
 * Os sete dias da semana, cada um com "abre" e a faixa de horário. Controlado
 * de propósito: o mesmo componente serve o wizard de cadastro e a edição no
 * painel, que são formulários diferentes.
 */
export function OpeningHoursFields({
  value,
  onChange,
  disabled,
  errors,
  hideLegend,
}: {
  value: OpeningHoursFormInput;
  onChange: (value: OpeningHoursFormInput) => void;
  disabled?: boolean;
  errors?: Record<number, string>;
  /** esconde a legenda quando o título da tela já diz a mesma coisa */
  hideLegend?: boolean;
}) {
  function updateDay(weekday: number, patch: Partial<OpeningHoursDay>) {
    onChange({
      days: value.days.map((day) =>
        day.weekday === weekday ? { ...day, ...patch } : day,
      ),
    });
  }

  /** Copia a faixa do primeiro dia aberto para segunda a sexta. */
  function repeatOnWeekdays() {
    const source = value.days.find((day) => day.open && day.opens_at);

    if (!source) return;

    onChange({
      days: value.days.map((day) =>
        day.weekday >= 1 && day.weekday <= 5
          ? {
              ...day,
              open: true,
              opens_at: source.opens_at,
              closes_at: source.closes_at,
            }
          : day,
      ),
    });
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={cn("mb-2 font-medium", hideLegend && "sr-only")}>
        Horário de funcionamento
      </legend>

      {value.days.map((day) => {
        const label = WEEKDAY_LABELS[day.weekday as Weekday];
        const error = errors?.[day.weekday];

        return (
          <div key={day.weekday} className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <label
                className={cn(
                  "flex w-32 cursor-pointer items-center gap-2 text-sm",
                  !day.open && "text-muted-foreground",
                )}
              >
                <Checkbox
                  checked={day.open}
                  disabled={disabled}
                  onCheckedChange={(checked) =>
                    updateDay(day.weekday, { open: checked === true })
                  }
                />
                {label}
              </label>

              {day.open ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    type="time"
                    className="w-auto flex-1"
                    aria-label={`${label}: abre às`}
                    disabled={disabled}
                    value={day.opens_at}
                    onChange={(event) =>
                      updateDay(day.weekday, { opens_at: event.target.value })
                    }
                  />
                  <span className="text-sm text-muted-foreground">às</span>
                  <Input
                    type="time"
                    className="w-auto flex-1"
                    aria-label={`${label}: fecha às`}
                    disabled={disabled}
                    value={day.closes_at}
                    onChange={(event) =>
                      updateDay(day.weekday, { closes_at: event.target.value })
                    }
                  />
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Fechado</span>
              )}
            </div>

            {error && <FieldError errors={[{ message: error }]} />}
          </div>
        );
      })}

      <button
        type="button"
        className="self-start text-sm text-secondary underline underline-offset-4 disabled:opacity-50"
        disabled={disabled}
        onClick={repeatOnWeekdays}
      >
        Repetir o primeiro horário de segunda a sexta
      </button>
    </fieldset>
  );
}
