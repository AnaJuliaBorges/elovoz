import { OngContactForm } from "@/features/ongs";
import type { OngContactFormInput } from "../../model/schema";

export function OngContactStep({
  defaultValues,
  onSubmit,
  onBack,
}: {
  defaultValues: OngContactFormInput;
  onSubmit: (values: OngContactFormInput) => void;
  onBack: () => void;
}) {
  return (
    <OngContactForm
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      onBack={onBack}
      submitLabel="Continuar"
    />
  );
}
