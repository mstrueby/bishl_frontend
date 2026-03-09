import { PlayUpTracking } from "../types/PlayerValues";

export function countCalledMatches(
  player: { playUpTrackings?: PlayUpTracking[] },
  tournamentAlias: string,
  seasonAlias: string,
): number {
  return (player.playUpTrackings ?? [])
    .filter(
      (t) =>
        t.tournamentAlias === tournamentAlias &&
        t.seasonAlias === seasonAlias,
    )
    .flatMap((t) => t.occurrences)
    .filter((o) => o.counted)
    .length;
}
