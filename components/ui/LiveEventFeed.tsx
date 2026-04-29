import React from "react";
import { CldImage } from "next-cloudinary";
import { MatchValues, ScoresBase, PenaltiesBase, EventPlayer } from "../../types/MatchValues";
import { timeToSeconds, getPeriodLabel } from "../../utils/matchPeriods";

export interface GoalEvent extends ScoresBase {
  kind: "goal";
  timeSeconds: number;
  teamFlag: "home" | "away";
}

export interface PenaltyEvent extends PenaltiesBase {
  kind: "penalty";
  timeSeconds: number;
  teamFlag: "home" | "away";
}

export type FeedEvent = GoalEvent | PenaltyEvent;

interface PlayerAvatarProps {
  player: EventPlayer;
  size?: "sm" | "md";
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ player, size = "sm" }) => {
  const dim = size === "sm" ? 32 : 40;
  const cls = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";

  if (player.imageUrl && player.imageVisible) {
    return (
      <CldImage
        src={player.imageUrl}
        alt={`${player.displayFirstName ?? player.firstName} ${player.displayLastName ?? player.lastName}`}
        width={dim}
        height={dim}
        gravity="center"
        radius="max"
        className={`${cls} object-cover rounded-full flex-shrink-0`}
      />
    );
  }

  const initials =
    `${(player.displayFirstName ?? player.firstName)?.charAt(0) ?? ""}${(player.displayLastName ?? player.lastName)?.charAt(0) ?? ""}`.toUpperCase();

  return (
    <div
      className={`${cls} rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0`}
    >
      <span className="font-medium text-gray-500">{initials}</span>
    </div>
  );
};

interface GoalCardProps {
  event: GoalEvent;
}

const GoalCard: React.FC<GoalCardProps> = ({ event }) => (
  <div className="flex items-center gap-x-2.5 py-2.5 px-3">
    <PlayerAvatar player={event.goalPlayer} />
    <div className="flex-shrink-0 text-xs font-bold text-orange-700 bg-orange-100 rounded-full w-5 h-5 flex items-center justify-center">
      T
    </div>
    <div className="min-w-0 flex-grow">
      <p className="text-sm font-semibold text-gray-900 truncate">
        #{event.goalPlayer.jerseyNumber}{" "}
        {event.goalPlayer.displayFirstName ?? event.goalPlayer.firstName}{" "}
        {event.goalPlayer.displayLastName ?? event.goalPlayer.lastName}
      </p>
      {event.assistPlayer ? (
        <p className="text-xs text-gray-500 truncate">
          Assist: #{event.assistPlayer.jerseyNumber}{" "}
          {event.assistPlayer.displayFirstName ?? event.assistPlayer.firstName}{" "}
          {event.assistPlayer.displayLastName ?? event.assistPlayer.lastName}
        </p>
      ) : (
        <p className="text-xs text-gray-400 italic">Keine Vorlage</p>
      )}
    </div>
    <div className="flex-shrink-0 text-xs font-semibold text-gray-700 tabular-nums">
      {event.matchTime}
    </div>
  </div>
);

interface PenaltyCardProps {
  event: PenaltyEvent;
}

const PenaltyCard: React.FC<PenaltyCardProps> = ({ event }) => {
  const pc = event.penaltyCode as Record<string, string>;
  const pcKey = pc["key"] ?? "";
  const pcValue = pc["value"] ?? "";
  return (
    <div className="flex items-center gap-x-2.5 py-2.5 px-3 bg-gray-50">
      <PlayerAvatar player={event.penaltyPlayer} />
      <div className="flex-shrink-0 text-xs font-bold text-gray-600 bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center">
        S
      </div>
      <div className="min-w-0 flex-grow">
        <p className="text-sm font-medium text-gray-700 truncate">
          #{event.penaltyPlayer.jerseyNumber}{" "}
          {event.penaltyPlayer.displayFirstName ?? event.penaltyPlayer.firstName}{" "}
          {event.penaltyPlayer.displayLastName ?? event.penaltyPlayer.lastName}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {event.isGM && "GM · "}
          {event.isMP && "MP · "}
          {event.penaltyMinutes} Min. · {pcKey} – {pcValue}
        </p>
      </div>
      <div className="flex-shrink-0 text-xs font-semibold text-gray-600 tabular-nums">
        {event.matchTimeStart}
      </div>
    </div>
  );
};

interface PeriodGroup {
  label: string;
  events: FeedEvent[];
}

function buildPeriodGroups(feed: FeedEvent[], match: MatchValues): PeriodGroup[] {
  const groups: PeriodGroup[] = [];
  for (const event of feed) {
    const label = getPeriodLabel(event.timeSeconds, match.matchSettings);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.events.push(event);
    } else {
      groups.push({ label, events: [event] });
    }
  }
  return groups;
}

interface LiveEventFeedProps {
  match: MatchValues;
}

const LiveEventFeed: React.FC<LiveEventFeedProps> = ({ match }) => {
  const goals: GoalEvent[] = [
    ...(match.home.scores ?? []).map((g) => ({
      ...g,
      kind: "goal" as const,
      timeSeconds: timeToSeconds(g.matchTime),
      teamFlag: "home" as const,
    })),
    ...(match.away.scores ?? []).map((g) => ({
      ...g,
      kind: "goal" as const,
      timeSeconds: timeToSeconds(g.matchTime),
      teamFlag: "away" as const,
    })),
  ];

  const penalties: PenaltyEvent[] = [
    ...(match.home.penalties ?? []).map((p) => ({
      ...p,
      kind: "penalty" as const,
      timeSeconds: timeToSeconds(p.matchTimeStart),
      teamFlag: "home" as const,
    })),
    ...(match.away.penalties ?? []).map((p) => ({
      ...p,
      kind: "penalty" as const,
      timeSeconds: timeToSeconds(p.matchTimeStart),
      teamFlag: "away" as const,
    })),
  ];

  const feed: FeedEvent[] = [...goals, ...penalties].sort(
    (a, b) => a.timeSeconds - b.timeSeconds,
  );

  const numOfPeriods = match.matchSettings?.numOfPeriods ?? 1;
  const showSubheaders = numOfPeriods > 1;
  const groups = showSubheaders ? buildPeriodGroups(feed, match) : null;

  if (feed.length === 0) {
    return (
      <div className="py-10 text-sm text-gray-400 text-center italic">
        Noch keine Ereignisse
      </div>
    );
  }

  const renderEventRow = (event: FeedEvent, index: number) => {
    const isHome = event.teamFlag === "home";
    const eventKey = event._id ?? `event-${event.teamFlag}-${index}`;
    const dotColor = isHome ? "bg-orange-400" : "bg-gray-400";

    const cardContent =
      event.kind === "goal" ? (
        <GoalCard event={event as GoalEvent} />
      ) : (
        <PenaltyCard event={event as PenaltyEvent} />
      );

    return (
      <div key={eventKey} className="relative mb-1">
        {/* Mobile layout */}
        <div
          className={`md:hidden bg-white border rounded-md shadow-sm overflow-hidden ${
            isHome
              ? "mr-10 border-l-[3px] border-l-orange-300"
              : "ml-10 border-r-[3px] border-r-gray-300"
          }`}
        >
          {cardContent}
        </div>

        {/* Desktop timeline layout */}
        <div className="hidden md:flex items-center">
          {/* Left column — home */}
          <div className="flex-1 flex justify-end pr-4">
            {isHome && (
              <div className="w-full max-w-sm bg-white border rounded-md shadow-sm overflow-hidden">
                {cardContent}
              </div>
            )}
          </div>

          {/* Center dot */}
          <div
            className={`flex-shrink-0 w-3 h-3 rounded-full border-2 border-white ring-1 ring-gray-200 z-10 ${dotColor}`}
          />

          {/* Right column — away */}
          <div className="flex-1 flex justify-start pl-4">
            {!isHome && (
              <div className="w-full max-w-sm bg-white border rounded-md shadow-sm overflow-hidden">
                {cardContent}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!showSubheaders || !groups) {
    return (
      <div className="relative">
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 -translate-x-1/2" />
        <div className="relative">
          {feed.map((event, index) => renderEventRow(event, index))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Center timeline line — desktop only */}
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 -translate-x-1/2" />

      {groups.map((group) => (
        <div key={group.label} className="relative">
          {/* Period subheader */}
          <div className="relative z-10 flex justify-center my-4">
            <span className="bg-white border border-gray-200 rounded-full px-4 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide shadow-sm">
              {group.label}
            </span>
          </div>

          {group.events.map((event, index) =>
            renderEventRow(event, index),
          )}
        </div>
      ))}
    </div>
  );
};

export default LiveEventFeed;
