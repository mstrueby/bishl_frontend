import useSWR, { mutate } from 'swr';
import { useEffect } from 'react';
import apiClient from './apiClient';
import { ClubValues, TeamValues } from '../types/ClubValues';
import { PlayerValues } from '../types/PlayerValues';

export const TEAM_PLAYERS_FRESH_MS = 5 * 60 * 1000;

export interface TeamPlayerList {
  club: ClubValues;
  team: TeamValues;
  players: PlayerValues[];
  fetchedAt: number;
}

// JSON encoding prevents ambiguous keys when aliases contain delimiters.
export const teamPlayerKey = (clubId: string, teamAlias: string) =>
  `admin-team-players:${JSON.stringify([clubId, teamAlias])}`;

export async function fetchTeamPlayers(clubId: string, teamAlias: string): Promise<TeamPlayerList> {
  const clubResponse = await apiClient.get(`/clubs/id/${clubId}`);
  const club = (clubResponse.data?.data || clubResponse.data) as ClubValues;
  const [teamResponse, playersResponse] = await Promise.all([
    apiClient.get(`/clubs/${club.alias}/teams/${teamAlias}`),
    apiClient.get(`/players/clubs/${club.alias}/teams/${teamAlias}`, {
      params: { sortby: 'lastName', all: 'true' },
    }),
  ]);
  return {
    club,
    team: teamResponse.data?.data || teamResponse.data,
    players: playersResponse.data?.results || playersResponse.data || [],
    fetchedAt: Date.now(),
  };
}

export function useTeamPlayers(clubId?: string, teamAlias?: string | null, enabled = true) {
  const key = enabled && clubId && teamAlias ? teamPlayerKey(clubId, teamAlias) : null;
  const { data, error, isValidating, mutate: refresh } = useSWR<TeamPlayerList>(
    key,
    () => fetchTeamPlayers(clubId!, teamAlias!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      shouldRetryOnError: false,
      keepPreviousData: false,
    },
  );

  // SWR won't refresh cached entries on mount with revalidateIfStale disabled.
  // Refresh only expired entries; leave them visible throughout the request.
  useEffect(() => {
    if (key && data && Date.now() - data.fetchedAt >= TEAM_PLAYERS_FRESH_MS) {
      void refresh();
    }
  }, [key, data?.fetchedAt, refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, error, isValidating, refresh };
}

export function updateCachedPlayer(
  clubId: string,
  teamAlias: string,
  playerId: string,
  changes: Partial<PlayerValues>,
) {
  return mutate<TeamPlayerList>(
    teamPlayerKey(clubId, teamAlias),
    current => current
      ? {
          ...current,
          players: current.players.map(player =>
            player._id === playerId ? { ...player, ...changes } : player,
          ),
        }
      : current,
    { revalidate: false },
  );
}

// Use only when a mutation changes server-generated fields that the PATCH
// response does not return (for example an uploaded image URL).
export function revalidateTeamPlayers(clubId: string, teamAlias: string) {
  return mutate(teamPlayerKey(clubId, teamAlias));
}