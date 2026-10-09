import apiClient from './apiClient';
import type { MatchValues } from '../types/MatchValues';

export interface CalendarMatchdayOwner {
  clubId: string;
  clubName: string;
  clubAlias: string;
}

export type CalendarMatchdayOwners = Record<string, CalendarMatchdayOwner | null>;

export function calendarMatchdayKey(match: MatchValues): string {
  return JSON.stringify([
    match.tournament.alias,
    match.season.alias,
    match.round.alias,
    match.matchday.alias,
  ]);
}

// The individual matchday endpoint is authoritative; list endpoints can omit owner.
// Fetch once per matchday, not per match, and limit parallel backend requests.
export async function loadCalendarMatchdayOwners(
  matches: MatchValues[],
): Promise<CalendarMatchdayOwners> {
  const uniqueMatches = [...new Map(
    matches.map(match => [calendarMatchdayKey(match), match]),
  ).values()];
  const owners: CalendarMatchdayOwners = {};
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < uniqueMatches.length) {
      const match = uniqueMatches[nextIndex++];
      const aliases = [
        match.tournament.alias,
        match.season.alias,
        match.round.alias,
        match.matchday.alias,
      ].map(encodeURIComponent);
      const response = await apiClient(
        `/tournaments/${aliases[0]}/seasons/${aliases[1]}/rounds/${aliases[2]}/matchdays/${aliases[3]}`,
      );
      // A malformed response must not be mistaken for an ownerless matchday.
      if (!response.data || typeof response.data !== 'object' || Array.isArray(response.data)) {
        throw new Error('Invalid calendar matchday response');
      }
      const owner = response.data.owner;
      if (owner?.clubId) {
        owners[calendarMatchdayKey(match)] = {
          clubId: owner.clubId,
          clubName: owner.clubName || '',
          clubAlias: owner.clubAlias || '',
        };
      } else {
        owners[calendarMatchdayKey(match)] = null;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(4, uniqueMatches.length) }, worker));
  return owners;
}
