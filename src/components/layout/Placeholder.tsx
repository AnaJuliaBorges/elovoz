import { Hammer } from "lucide-react";

/**
 * Tela provisória das rotas que já existem no shell mas cujas features
 * ainda não foram implementadas (needs, ONGs, admin, notificações).
 */
export function Placeholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <span className="rounded-full bg-muted p-4">
        <Hammer className="size-7 text-muted-foreground" />
      </span>

      <h1 className="text-xl font-medium">{title}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
