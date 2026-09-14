import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { todayIso } from "@/lib/dates";
import { useCategories } from "../hooks/useCategories";
import { URGENCIES, URGENCY_LABELS } from "../model/need";
import { needSchema, type NeedFormInput } from "../model/schema";

/**
 * Formulário de criar e editar. Quem usa monta este componente só com os
 * dados já carregados — `defaultValues` vale na montagem, sem `reset()` tardio.
 */
export function NeedForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel,
  error,
}: {
  defaultValues: NeedFormInput;
  onSubmit: (values: NeedFormInput) => void | Promise<void>;
  submitting: boolean;
  submitLabel: string;
  error: string | null;
}) {
  const { data: categories } = useCategories();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NeedFormInput>({
    resolver: zodResolver(needSchema),
    defaultValues,
  });

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <FieldGroup className="flex flex-col gap-4">
        <Field>
          <FieldLabel htmlFor="title">Título</FieldLabel>
          <Input
            id="title"
            placeholder="Ex.: Cestas básicas para 30 famílias"
            {...register("title")}
          />
          {errors.title && <FieldError errors={[errors.title]} />}
        </Field>

        <Controller
          control={control}
          name="category_id"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="category_id">Categoria</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="category_id" className="w-full">
                  {/* rótulo procurado na lista: o Radix só resolve sozinho
                      quando o dropdown abre */}
                  <SelectValue placeholder="Escolha a categoria">
                    {categories?.find((category) => category.id === field.value)
                      ?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Field>
          <FieldLabel htmlFor="description">Descrição (opcional)</FieldLabel>
          <Textarea
            id="description"
            className="h-32"
            placeholder="O que exatamente vocês precisam, tamanhos, marcas, como entregar..."
            {...register("description")}
          />
          {errors.description && <FieldError errors={[errors.description]} />}
        </Field>

        <Controller
          control={control}
          name="urgency"
          render={({ field }) => (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 font-medium">Urgência</legend>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="grid grid-cols-3 gap-2"
              >
                {URGENCIES.map((level) => (
                  <label
                    key={level}
                    className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm has-[[data-state=checked]]:border-primary"
                  >
                    <RadioGroupItem value={level} />
                    {URGENCY_LABELS[level]}
                  </label>
                ))}
              </RadioGroup>
              {errors.urgency && <FieldError errors={[errors.urgency]} />}
            </fieldset>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="quantity">Quantidade (opcional)</FieldLabel>
            <Input
              id="quantity"
              inputMode="numeric"
              placeholder="Ex.: 30"
              {...register("quantity")}
            />
            {errors.quantity && <FieldError errors={[errors.quantity]} />}
          </Field>

          <Field>
            <FieldLabel htmlFor="deadline">Prazo (opcional)</FieldLabel>
            <Input
              id="deadline"
              type="date"
              min={todayIso()}
              {...register("deadline")}
            />
            <FieldDescription>
              Depois do prazo, a necessidade sai da busca.
            </FieldDescription>
            {errors.deadline && <FieldError errors={[errors.deadline]} />}
          </Field>
        </div>
      </FieldGroup>

      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive-light p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}
