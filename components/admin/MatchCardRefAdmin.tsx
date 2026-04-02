import React from "react";
import {
  CalendarIcon,
  MapPinIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import {
  tournamentConfigs,
  refereeLevels,
  allRefereeAssignmentStatuses,
} from "../../tools/consts";
import { classNames } from "../../tools/utils";
import { CldImage } from "next-cloudinary";
import { RefToolMatch } from "../../types/RefToolValues";

type MatchCardRefAdminProps = {
  match: RefToolMatch;
  onOpenDetail: (match: RefToolMatch) => void;
};

const LEVEL_ORDER = Object.entries(refereeLevels)
  .sort((a, b) => a[1].sortOrder - b[1].sortOrder)
  .map(([key]) => key);

const MatchCardRefAdmin: React.FC<MatchCardRefAdminProps> = ({
  match,
  onOpenDetail,
}) => {
  const { home, away, startDate, venue, referee1, referee2, refSummary } =
    match;
  const tournamentConfig = tournamentConfigs[match.tournament.alias];

  const formattedDateShort = new Date(startDate).toLocaleString("de-DE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedDateLong = new Date(startDate).toLocaleString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const getStatusColor = (userId: string) => {
    const statusKey =
      userId === referee1?.userId
        ? referee1?.assignmentStatus
        : referee2?.assignmentStatus;
    const statusConfig = allRefereeAssignmentStatuses.find(
      (s) => s.key === statusKey,
    );
    return statusConfig?.color.dotRefAdmin ?? "fill-gray-400";
  };

  const refLevelBadge = (level: string) => {
    const config =
      refereeLevels[level as keyof typeof refereeLevels] ??
      refereeLevels["n/a"];
    return (
      <span
        className={classNames(
          "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset",
          config.background,
          config.text,
          config.ring,
        )}
      >
        {level}
      </span>
    );
  };

  const RefSlot = ({
    referee,
    label,
  }: {
    referee: typeof referee1;
    label: string;
  }) => {
    if (!referee) {
      return (
        <div className="flex items-center gap-2 text-gray-400">
          <div className="h-7 w-7 rounded-full border bg-gray-100 flex items-center justify-center">
            <span className="text-xs text-gray-300">?</span>
          </div>
          <span className="text-xs text-gray-400 italic">{label}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <svg
          className={`h-2 w-2 flex-shrink-0 ${getStatusColor(referee.userId)}`}
          viewBox="0 0 8 8"
        >
          <circle cx="4" cy="4" r="4" />
        </svg>
        <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-semibold text-gray-700">
            {referee.firstName.charAt(0)}
            {referee.lastName.charAt(0)}
          </span>
        </div>
        <span className="text-sm text-gray-700 truncate">
          {referee.firstName} {referee.lastName}
        </span>
        {refLevelBadge(referee.level)}
      </div>
    );
  };

  const requestedLevels = Object.entries(refSummary?.requestsByLevel ?? {})
    .filter(([, count]) => count > 0)
    .sort((a, b) => {
      const iA = LEVEL_ORDER.indexOf(a[0]);
      const iB = LEVEL_ORDER.indexOf(b[0]);
      return (iA === -1 ? 999 : iA) - (iB === -1 ? 999 : iB);
    });

  const assignedCount = refSummary?.assignedCount ?? 0;

  const slotColor =
    assignedCount >= 2
      ? "bg-green-500"
      : assignedCount === 1
        ? "bg-yellow-400"
        : "bg-red-400";

  const slotHover =
    assignedCount >= 2
      ? "hover:bg-green-50"
      : assignedCount === 1
        ? "hover:bg-yellow-50"
        : "hover:bg-red-50";

  const defaultLogo =
    "https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png";

  const StatusPills = () => (
    <div className="flex flex-wrap gap-1.5">
      {(refSummary?.requestedCount ?? 0) > 0 && (
        <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700">
          {refSummary.requestedCount}
        </span>
      )}
      {(refSummary?.availableCount ?? 0) > 0 && (
        <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
          {refSummary.availableCount}
        </span>
      )}
      {(refSummary?.unavailableCount ?? 0) > 0 && (
        <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700">
          {refSummary.unavailableCount}
        </span>
      )}
    </div>
  );

  const LevelBadges = ({ countOnly }: { countOnly?: boolean }) => (
    <div className="flex flex-wrap gap-1.5">
      {requestedLevels.map(([level, count]) => {
        const config =
          refereeLevels[level as keyof typeof refereeLevels] ??
          refereeLevels["n/a"];
        const colorMatch = config.background.match(/bg-(\w+)-\d+/);
        const colorName = colorMatch?.[1] ?? "gray";
        const countPillBg = `bg-${colorName}-100`;
        const countPillRing = config.ring;
        if (countOnly) {
          return (
            <span
              key={level}
              className={classNames(
                "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
                config.background,
                config.text,
                config.ring,
              )}
            >
              {count}
            </span>
          );
        }
        return (
          <span
            key={level}
            className={classNames(
              "inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium ring-1 ring-inset",
              config.background,
              config.text,
              config.ring,
            )}
          >
            {level}
            <span
              className={classNames(
                "inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
                countPillBg,
                config.text,
                countPillRing,
              )}
            >
              {count}
            </span>
          </span>
        );
      })}
    </div>
  );

  const TournamentBadge = () =>
    tournamentConfig ? (
      <span
        className={classNames(
          "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset",
          tournamentConfig.bdgColLight,
        )}
      >
        {tournamentConfig.tinyName}
        {match.round.name !== "Hauptrunde" && ` – ${match.round.name}`}
      </span>
    ) : null;

  const ChevronButton = () => (
    <button
      onClick={() => onOpenDetail(match)}
      className="flex-shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
      aria-label="Details öffnen"
    >
      <ChevronRightIcon className="h-5 w-5" />
    </button>
  );

  const PrimaryButton = () => (
    <button
      onClick={() => onOpenDetail(match)}
      className="w-full inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 py-1.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
    >
      Einteilen
    </button>
  );

  return (
    <div
      className={classNames(
        "bg-white rounded-xl border-2 border-gray-200 shadow-md overflow-hidden transition-colors",
        slotHover,
      )}
    >
      <div className="flex items-stretch">
        {/* Left color bar - visible on all sizes */}
        <div className={`w-1 flex-shrink-0 ${slotColor}`} />

        {/* ── MOBILE layout (hidden on sm+) ── */}
        <div className="flex-1 min-w-0 sm:hidden px-3 py-3 space-y-3">
          {/* Row 1: tournament badge */}
          <div>
            <TournamentBadge />
          </div>

          {/* Row 2: date (left) + venue (right) */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-1 min-w-0">
              <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
              <span className="text-xs text-gray-600 truncate">
                {formattedDateShort}
              </span>
            </div>
            <div className="flex items-center gap-1 min-w-0 justify-end">
              <MapPinIcon className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
              <span className="text-xs text-gray-600 truncate">
                {venue.name}
              </span>
            </div>
          </div>

          {/* Row 3: home logo+name (left) vs away name+logo (right) */}
          <div className="flex items-center justify-between gap-2">
            {/* home */}
            <div className="flex items-center gap-2 min-w-0">
              <CldImage
                src={home.logo || defaultLogo}
                alt={home.tinyName}
                width={24}
                height={24}
                crop="fit"
                className="h-6 w-6 flex-shrink-0 object-contain"
              />
              <span className="text-sm font-medium text-gray-700 truncate">
                {home.shortName}
              </span>
            </div>
            {/* away (mirrored: name then logo) */}
            <div className="flex items-center gap-2 min-w-0 justify-end">
              <span className="text-sm font-medium text-gray-700 truncate">
                {away.shortName}
              </span>
              <CldImage
                src={away.logo || defaultLogo}
                alt={away.tinyName}
                width={24}
                height={24}
                crop="fit"
                className="h-6 w-6 flex-shrink-0 object-contain"
              />
            </div>
          </div>

          {/* Row 4: referees side by side (50/50) */}
          <div className="flex gap-2 border-t border-b border-gray-200 py-3">
            <div className="w-1/2 min-w-0">
              <RefSlot referee={referee1} label="Pos 1 frei" />
            </div>
            <div className="w-1/2 min-w-0">
              <RefSlot referee={referee2} label="Pos 2 frei" />
            </div>
          </div>

          {/* Row 5: status pills + level badges count-only */}
          <div className="flex gap-3 items-center flex-wrap">
            <StatusPills />
            <LevelBadges countOnly />
          </div>

          {/* Row 6: primary button */}
          <div className="pt-2">
            <PrimaryButton />
          </div>
        </div>

        {/* ── DESKTOP layout (hidden on mobile, flex on sm+) ── */}
        <div className="hidden sm:flex items-stretch flex-1 min-w-0">
          {/* Section 1: Tournament + Date + Venue */}
          <div className="flex flex-col justify-between px-3 py-3 w-1/4 min-w-0 border-r border-gray-100">
            <div>
              <TournamentBadge />
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                <span className="text-xs text-gray-600 truncate">
                  {formattedDateLong}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <MapPinIcon className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                <span className="text-xs text-gray-600 truncate">
                  {venue.name}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Teams */}
          <div className="flex flex-col justify-center gap-2 px-3 py-3 w-1/4 min-w-0 border-r border-gray-100">
            <div className="flex items-center gap-2">
              <CldImage
                src={home.logo || defaultLogo}
                alt={home.tinyName}
                width={28}
                height={28}
                crop="fit"
                className="h-7 w-7 flex-shrink-0 object-contain"
              />
              <span className="text-sm font-medium text-gray-700 truncate">
                {home.shortName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CldImage
                src={away.logo || defaultLogo}
                alt={away.tinyName}
                width={28}
                height={28}
                crop="fit"
                className="h-7 w-7 flex-shrink-0 object-contain"
              />
              <span className="text-sm font-medium text-gray-700 truncate">
                {away.shortName}
              </span>
            </div>
          </div>

          {/* Section 3: Assigned referees */}
          <div className="flex flex-col justify-center gap-2 px-3 py-3 w-1/4 min-w-0 border-r border-gray-100">
            <RefSlot referee={referee1} label="Pos 1 frei" />
            <RefSlot referee={referee2} label="Pos 2 frei" />
          </div>

          {/* Section 4: RefSummary + Chevron */}
          <div className="flex items-center w-1/4 min-w-0 pl-3 pr-2 py-3 gap-2">
            <div className="flex-1 min-w-0 space-y-3">
              <StatusPills />
              {requestedLevels.length > 0 && <LevelBadges />}
            </div>
            <ChevronButton />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchCardRefAdmin;
