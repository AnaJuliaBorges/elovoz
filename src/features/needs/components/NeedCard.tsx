import { Building2, CalendarClock, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDate } from "@/lib/dates";
import { formatOngLocation, type NeedWithOng } from "../model/need";
import { NeedStatusBadge, UrgencyBadge } from "./NeedBadges";

export function NeedCard({ need }: { need: NeedWithOng }) {
  const location = formatOngLocation(need.ong);

  return (
    <Link
      to={`/necessidades/${need.id}`}
      className="flex h-full flex-col gap-3 rounded-lg border bg-surface p-4 transition-colors outline-none hover:border-primary/60 focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {need.category?.name}
        </span>
        <UrgencyBadge urgency={need.urgency} />
      </div>

      <h2 className="leading-snug font-medium">{need.title}</h2>

      {need.status === "partially_fulfilled" && (
        <NeedStatusBadge status={need.status} />
      )}

      <div className="mt-auto flex flex-col gap-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Building2 className="size-4 shrink-0" aria-hidden="true" />
          {need.ong.trade_name}
        </span>

        {location && (
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            {location}
          </span>
        )}

        {need.deadline && (
          <span className="flex items-center gap-1.5">
            <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
            Até {formatDate(need.deadline)}
          </span>
        )}
      </div>
    </Link>
  );
}
