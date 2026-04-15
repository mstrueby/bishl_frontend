import Link from "next/link";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { RoundValues } from "../../types/TournamentValues";

interface RoundCardProps {
  round: RoundValues;
  tAlias: string;
  sAlias: string;
}

function formatDateRange(
  startDate?: Date | string | null,
  endDate?: Date | string | null,
): string {
  if (!startDate && !endDate) return "";

  const parse = (d: Date | string) =>
    typeof d === "string" ? new Date(d) : d;

  if (startDate && endDate) {
    const from = parse(startDate);
    const to = parse(endDate);
    const fromStr = format(from, "d. LLL", { locale: de });
    const toStr = format(to, "d. LLL", { locale: de });
    return from.toDateString() === to.toDateString()
      ? fromStr
      : `${fromStr} – ${toStr}`;
  }

  if (startDate) return format(parse(startDate), "d. LLL", { locale: de });
  if (endDate) return format(parse(endDate), "d. LLL", { locale: de });

  return "";
}

export default function RoundCard({ round, tAlias, sAlias }: RoundCardProps) {
  const roundUrl = `/tournaments/${tAlias}/${sAlias}/${round.alias}`;
  const dateRange = formatDateRange(round.startDate, round.endDate);

  return (
    <div className="relative flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-1 bg-indigo-600" aria-hidden="true" />
      <div className="pl-5 pr-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-gray-900 leading-snug">
            {round.name}
          </h3>
          {dateRange && (
            <p className="mt-0.5 text-sm text-gray-500">{dateRange}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href={roundUrl}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Spielplan
          </Link>
          {round.createStandings && (
            <Link
              href={`${roundUrl}?tab=tabelle`}
              className="inline-flex items-center rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Tabelle
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
