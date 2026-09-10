import {
  useController,
  type Control,
  type FieldValues,
  type Path,
  type PathValue,
} from "react-hook-form";
import {
  Field,
  FieldError,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { useStates, useCities } from "@/hooks/useLocations";

export function LocationFields<T extends FieldValues>({
  control,
  className = "grid grid-cols-1 gap-4 sm:grid-cols-2",
}: {
  control: Control<T>;
  className?: string;
}) {
  const stateField = useController({ control, name: "state_id" as Path<T> });
  const cityField = useController({ control, name: "city_id" as Path<T> });

  const stateId = (stateField.field.value as string | undefined) || undefined;

  const { data: states } = useStates();
  const { data: cities } = useCities(stateId);

  return (
    <div className={className}>
      <Field>
        <Select
          value={stateField.field.value ?? ""}
          onValueChange={(value) => {
            stateField.field.onChange(value);
            cityField.field.onChange("" as PathValue<T, Path<T>>);
          }}
        >
          <SelectTrigger className="w-full" aria-label="Estado">
            {/* o Radix não resolve o rótulo sozinho quando o valor vem do
                form: procuramos o nome do estado na lista carregada */}
            <SelectValue placeholder="Estado">
              {states?.find((state) => state.id === stateField.field.value)
                ?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {states?.map((state) => (
                <SelectItem key={state.id} value={state.id}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {stateField.fieldState.error && (
          <FieldError errors={[stateField.fieldState.error]} />
        )}
      </Field>

      <Field>
        <Select
          value={cityField.field.value ?? ""}
          onValueChange={(value) => cityField.field.onChange(value)}
          disabled={!stateId}
        >
          <SelectTrigger className="w-full" aria-label="Cidade">
            <SelectValue placeholder="Cidade">
              {cities?.find((city) => city.id === cityField.field.value)?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {cities?.map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {cityField.fieldState.error && (
          <FieldError errors={[cityField.fieldState.error]} />
        )}
      </Field>
    </div>
  );
}
