import { toast } from "sonner";
import { Copy, MapPin } from "lucide-react";
import { Button } from "@/components/ui";
import {
  formatFullAddress,
  googleMapsLink,
  type OngProfile,
} from "../model/ong";

/**
 * Endereço da ONG com atalhos para o doador chegar lá: copiar (para colar num
 * app de transporte, por exemplo) e abrir direto no Google Maps.
 */
export function OngAddress({
  ong,
}: {
  ong: Pick<OngProfile, "address" | "neighborhood" | "city" | "state">;
}) {
  const address = formatFullAddress(ong);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Endereço copiado");
    } catch {
      // a Clipboard API só existe em contexto seguro (https) e pode ser negada
      toast.error("Não foi possível copiar. Selecione o endereço e copie.");
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* copiar é ação secundária: só o ícone, colado no endereço */}
      <div className="flex items-center gap-1">
        <p className="text-sm">{address}</p>
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground hover:text-secondary"
          aria-label="Copiar endereço"
          title="Copiar endereço"
          onClick={handleCopy}
        >
          <Copy aria-hidden="true" />
        </Button>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="shrink-0 self-start text-sm"
        asChild
      >
        <a href={googleMapsLink(ong)} target="_blank" rel="noreferrer">
          <MapPin aria-hidden="true" />
          Google Maps
        </a>
      </Button>
    </div>
  );
}
