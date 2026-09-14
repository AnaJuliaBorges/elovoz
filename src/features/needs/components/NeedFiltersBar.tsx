import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { X } from "lucide-react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { LocationFields } from "@/components/shared/LocationFields";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useCategories } from "../hooks/useCategories";
import {
  URGENCIES,
  URGENCY_LABELS,
  type NeedFilters,
  type Urgency,
} from "../model/need";

type FiltersForm = {
  category_id: string;
  urgency: string;
  state_id: string;
  city_id: string;
  neighborhood: string;
};

const EMPTY_FILTERS: FiltersForm = {
  category_id: "",
  urgency: "",
  state_id: "",
  city_id: "",
  neighborhood: "",
};

// o Radix Select não aceita item com valor "": "todas" ganha um valor próprio
const ALL = "all";

export function NeedFiltersBar({
  filters,
  onChange,
}: {
  filters: NeedFilters;
  onChange: (filters: NeedFilters) => void;
}) {
  const { data: categories } = useCategories();

  const { control, register, reset } = useForm<FiltersForm>({
    defaultValues: {
      category_id: filters.categoryId ?? "",
      urgency: filters.urgency ?? "",
      state_id: filters.stateId ?? "",
      city_id: filters.cityId ?? "",
      neighborhood: filters.neighborhood ?? "",
    },
  });

  const [categoryId, urgency, stateId, cityId, neighborhood] = useWatch({
    control,
    name: ["category_id", "urgency", "state_id", "city_id", "neighborhood"],
  });

  // bairro é texto livre: sem o debounce, cada letra seria uma busca
  const debouncedNeighborhood = useDebouncedValue(neighborhood);

  useEffect(() => {
    onChange({
      categoryId: categoryId || undefined,
      urgency: (urgency || undefined) as Urgency | undefined,
      stateId: stateId || undefined,
      cityId: cityId || undefined,
      neighborhood: debouncedNeighborhood.trim() || undefined,
    });
  }, [categoryId, urgency, stateId, cityId, debouncedNeighborhood, onChange]);

  const hasFilters = Boolean(
    categoryId || urgency || stateId || cityId || neighborhood,
  );

  return (
    <section
      aria-label="Filtros"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    >
      <Controller
        control={control}
        name="category_id"
        render={({ field }) => (
          <Select
            value={field.value || ALL}
            onValueChange={(value) => field.onChange(value === ALL ? "" : value)}
          >
            <SelectTrigger className="w-full" aria-label="Categoria">
              <SelectValue>
                {categories?.find((category) => category.id === field.value)
                  ?.name ?? "Todas as categorias"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={ALL}>Todas as categorias</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      />

      <Controller
        control={control}
        name="urgency"
        render={({ field }) => (
          <Select
            value={field.value || ALL}
            onValueChange={(value) => field.onChange(value === ALL ? "" : value)}
          >
            <SelectTrigger className="w-full" aria-label="Urgência">
              <SelectValue>
                {field.value
                  ? `Urgência ${URGENCY_LABELS[field.value as Urgency].toLowerCase()}`
                  : "Qualquer urgência"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={ALL}>Qualquer urgência</SelectItem>
                {[...URGENCIES].reverse().map((level) => (
                  <SelectItem key={level} value={level}>
                    Urgência {URGENCY_LABELS[level].toLowerCase()}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      />

      <LocationFields control={control} className="contents" />

      <Input
        aria-label="Bairro"
        placeholder="Bairro"
        {...register("neighborhood")}
      />

      {hasFilters && (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="justify-self-start sm:col-span-2 lg:col-span-3 xl:col-span-5"
          onClick={() => reset(EMPTY_FILTERS)}
        >
          <X aria-hidden="true" />
          Limpar filtros
        </Button>
      )}
    </section>
  );
}
