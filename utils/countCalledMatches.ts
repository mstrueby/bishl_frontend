import { PlayUpTracking } from "../types/PlayerValues";
import { CallUpType } from "../types/TournamentValues";

export function countCalledMatches(
  player: { playUpTrackings?: PlayUpTracking[] },
  tournamentAlias: string,
  seasonAlias: string,
  callUpType: CallUpType = CallUpType.MATCH,
): number {
  const countedOccurrences = (player.playUpTrackings ?? [])
    .filter(
      (t) =>
        t.tournamentAlias === tournamentAlias &&
        t.seasonAlias === seasonAlias,
    )
    .flatMap((t) => t.occurrences)
    .filter((o) => o.counted);

  if (callUpType === CallUpType.MATCHDAY) {
    const distinctMatchdayIds = new Set(countedOccurrences.map((o) => o.matchdayId));
    return distinctMatchdayIds.size;
  }

  return countedOccurrences.length;
}
