import React from "react";
import { CldImage } from "next-cloudinary";
import { MatchValues, ScoresBase, PenaltiesBase, EventPlayer } from "../../types/MatchValues";
import { MatchSettings } from "../../types/TournamentValues";
import { getPeriodLabel } from "../../utils/matchPeriods";

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
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ player }) => {
  if (player.imageUrl && player.imageVisible) {
    return (
      <CldImage
        src={player.imageUrl}
        alt={`${player.displayFirstName ?? player.firstName} ${player.displayLastName ?? player.lastName}`}
        width={32}
        height={32}
        gravity="center"
        radius="max"
        className="w-8 h-8 object-cover rounded-full flex-shrink-0"
      />
    );
  }

  const initials = `${(player.displayFirstName ?? player.firstName)?.charAt(0) ?? ""}${(player.displayLastName ?? player.lastName)?.charAt(0) ?? ""}`.toUpperCase();

  return (
    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-medium text-gray-500">{initials}</span>
    </div>
  );
};

interface GoalCardProps { event: GoalEvent; }

const GoalCard: React.FC<GoalCardProps> = ({ event }) => (
  <div className="flex items-center gap-x-6 py-2.5 px-3">
    <div className="flex-shrink-0 flex flex-col items-center gap-y-1 w-8">
      <div className="flex-shrink-0 text-xs font-bold text-white bg-orange-700 rounded-full w-5 h-5 flex items-center justify-center">
        T
      </div>
      <span className="text-[10px] font-medium text-gray-600 tabular-nums leading-none">{event.matchTime}</span>
    </div>
    <div className="flex items-center gap-x-2.5 min-w-0 flex-grow">
      <PlayerAvatar player={event.goalPlayer} />
      <div className="min-w-0 flex-grow">
      <p className="text-sm font-semibold text-gray-900 truncate">
        #{event.goalPlayer.jerseyNumber}{" "}
        {event.goalPlayer.displayFirstName ?? event.goalPlayer.firstName}{" "}
        {event.goalPlayer.displayLastName ?? event.goalPlayer.lastName}
      </p>
      {event.assistPlayer ? (
        <p className="text-xs text-gray-500 truncate">
          Vorlage: #{event.assistPlayer.jerseyNumber}{" "}
          {event.assistPlayer.displayFirstName ?? event.assistPlayer.firstName}{" "}
          {event.assistPlayer.displayLastName ?? event.assistPlayer.lastName}
        </p>
      ) : (
        <p className="text-xs text-gray-400 italic">Keine Vorlage</p>
      )}
      </div>
    </div>
  </div>
);

interface PenaltyCardProps { event: PenaltyEvent; }

const PenaltyCard: React.FC<PenaltyCardProps> = ({ event }) => {
  const pc = event.penaltyCode as Record<string, string>;
  const pcKey = pc["key"] ?? "";
  const pcValue = pc["value"] ?? "";
  return (
    <div className="flex items-center gap-x-6 py-2.5 px-3 bg-gray-50">
      <div className="flex-shrink-0 flex flex-col items-center gap-y-1 w-8">
        <div className="flex-shrink-0 text-xs font-bold text-gray-600 bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center">
          S
        </div>
        <span className="text-[10px] font-medium text-gray-600 tabular-nums leading-none">{event.matchTimeStart}</span>
      </div>
      <div className="flex items-center gap-x-2.5 min-w-0 flex-grow">
        <PlayerAvatar player={event.penaltyPlayer} />
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
      </div>
    </div>
  );
};

interface PeriodGroup {
  label: string;
  events: FeedEvent[];
}

function buildPeriodGroups(feed: FeedEvent[], settings: MatchSettings): PeriodGroup[] {
  const groups: PeriodGroup[] = [];
  for (const event of feed) {
    const label = getPeriodLabel(event.timeSeconds, settings);
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
  feed: FeedEvent[];
  match: MatchValues;
  settings: MatchSettings;
}

const LiveEventFeed: React.FC<LiveEventFeedProps> = ({ feed, match, settings }) => {
  const numOfPeriods = settings.numOfPeriods ?? 1;
  const showSubheaders = numOfPeriods > 1;
  const groups = showSubheaders ? buildPeriodGroups(feed, settings) : null;

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

    const cardContent = event.kind === "goal"
      ? <GoalCard event={event} />
      : <PenaltyCard event={event} />;

    const isGoal = event.kind === "goal";
    const accentBorder = isHome
      ? isGoal ? "border-l-[3px] border-l-orange-600" : "border-l-[3px] border-l-gray-400"
      : isGoal ? "border-r-[3px] border-r-orange-600" : "border-r-[3px] border-r-gray-400";

    return (
      <div key={eventKey} className="relative mb-3 md:mb-1">
        {/* Mobile layout: home=left border, away=right border; color by event type */}
        <div
          className={`md:hidden bg-white border rounded-md shadow-sm overflow-hidden ${accentBorder} ${
            isHome ? "mr-10" : "ml-10"
          }`}
        >
          {cardContent}
        </div>

        {/* Desktop layout: center timeline with left/right columns */}
        <div className="hidden md:flex items-center">
          <div className="flex-1 flex justify-end pr-4">
            {isHome && (
              <div className="w-full max-w-sm bg-white border rounded-md shadow-sm overflow-hidden">
                {cardContent}
              </div>
            )}
          </div>
          <div className={`flex-shrink-0 w-3 h-3 rounded-full border-2 border-white ring-1 ring-gray-200 z-10 ${dotColor}`} />
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
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 -translate-x-1/2" />
      {groups.map((group) => (
        <div key={group.label} className="relative">
          <div className="relative z-10 flex justify-center my-4">
            <span className="bg-white border border-gray-200 rounded-full px-4 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide shadow-sm">
              {group.label}
            </span>
          </div>
          {group.events.map((event, index) => renderEventRow(event, index))}
        </div>
      ))}
    </div>
  );
};

export default LiveEventFeed;
