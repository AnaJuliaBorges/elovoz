import { groupOpeningHours, type OpeningHour } from "../model/openingHours";

/** Horários agrupados para leitura ("Seg a Sex, 09:00 às 17:00"). */
export function OngOpeningHours({ hours }: { hours: OpeningHour[] }) {
  const groups = groupOpeningHours(hours);

  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Esta instituição ainda não informou os horários de funcionamento.
      </p>
    );
  }

  return (
    <dl className="flex flex-col gap-1 text-sm">
      {groups.map((group) => (
        <div key={group.days} className="flex flex-wrap gap-x-3">
          <dt className="min-w-24 font-medium">{group.days}</dt>
          <dd className="text-muted-foreground">
            {group.opens_at} às {group.closes_at}
          </dd>
        </div>
      ))}
    </dl>
  );
}
