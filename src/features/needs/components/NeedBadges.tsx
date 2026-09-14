import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  NEED_STATUS_LABELS,
  URGENCY_LABELS,
  type NeedStatus,
  type Urgency,
} from "../model/need";

// texto em cor de fundo clara + bolinha na cor forte: amarelo e verde como
// cor de texto não passam em contraste
const URGENCY_STYLES: Record<Urgency, { badge: string; dot: string }> = {
  low: { badge: "bg-success-light", dot: "bg-success" },
  medium: { badge: "bg-warning-light", dot: "bg-warning" },
  high: { badge: "bg-destructive-light", dot: "bg-destructive" },
};

const STATUS_STYLES: Record<NeedStatus, { badge: string; dot: string }> = {
  open: { badge: "bg-info-light", dot: "bg-info" },
  partially_fulfilled: { badge: "bg-warning-light", dot: "bg-warning" },
  fulfilled: { badge: "bg-success-light", dot: "bg-success" },
};

function Dot({ className }: { className: string }) {
  return (
    <span aria-hidden="true" className={cn("size-2 rounded-full", className)} />
  );
}

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const style = URGENCY_STYLES[urgency];

  return (
    <Badge className={cn("text-foreground", style.badge)}>
      <Dot className={style.dot} />
      Urgência {URGENCY_LABELS[urgency].toLowerCase()}
    </Badge>
  );
}

export function NeedStatusBadge({ status }: { status: NeedStatus }) {
  const style = STATUS_STYLES[status];

  return (
    <Badge className={cn("text-foreground", style.badge)}>
      <Dot className={style.dot} />
      {NEED_STATUS_LABELS[status]}
    </Badge>
  );
}
