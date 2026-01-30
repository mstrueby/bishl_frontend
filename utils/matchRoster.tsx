import { RosterPlayer } from '../types/MatchValues';

export const sortRoster = (rosterToSort: RosterPlayer[]): RosterPlayer[] => {
  if (!rosterToSort || rosterToSort.length === 0) return [];

  return [...rosterToSort].sort((a, b) => {
    const positionPriority: Record<string, number> = { 'C': 1, 'A': 2, 'G': 3, 'F': 4 };

    const posA = positionPriority[a.playerPosition.key] || 99;
    const posB = positionPriority[b.playerPosition.key] || 99;

    if (posA !== posB) {
      return posA - posB;
    }

    const jerseyA = a.player.jerseyNumber || 999;
    const jerseyB = b.player.jerseyNumber || 999;
    return jerseyA - jerseyB;
  });
};
