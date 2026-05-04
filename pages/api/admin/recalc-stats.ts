import { NextApiRequest, NextApiResponse } from 'next';
import { withAnyRole, getAccessToken } from '../../../lib/serverAuth';
import { UserRole } from '../../../lib/auth';
import { logApiError } from '../../../lib/apiLogger';
import { MatchValues, Team, ScoresBase, PenaltiesBase, RosterPlayer } from '../../../types/MatchValues';
import { PlayerValues } from '../../../types/PlayerValues';

interface RecalcBody {
  tournament: string;
  season: string;
}

interface PlayerStatComputed {
  goals: number;
  assists: number;
  penaltyMinutes: number;
}

interface PlayerSeasonAggregate {
  teamAlias: string;
  stats: {
    gamesPlayed: number;
    goals: number;
    assists: number;
    points: number;
    penaltyMinutes: number;
  };
}

interface PaginatedMatchResponse {
  data?: MatchValues[];
  pagination?: {
    has_next: boolean;
  };
}

interface PaginatedPlayerResponse {
  data?: PlayerValues;
}

function buildStatsMap(
  scores: ScoresBase[],
  penalties: PenaltiesBase[]
): Record<string, PlayerStatComputed> {
  const statsMap: Record<string, PlayerStatComputed> = {};

  const init = (pid: string) => {
    if (!statsMap[pid]) statsMap[pid] = { goals: 0, assists: 0, penaltyMinutes: 0 };
  };

  for (const score of scores) {
    if (score.goalPlayer?.playerId) {
      init(score.goalPlayer.playerId);
      statsMap[score.goalPlayer.playerId].goals += 1;
    }
    if (score.assistPlayer?.playerId) {
      init(score.assistPlayer.playerId);
      statsMap[score.assistPlayer.playerId].assists += 1;
    }
  }

  for (const penalty of penalties) {
    if (penalty.penaltyPlayer?.playerId) {
      init(penalty.penaltyPlayer.playerId);
      statsMap[penalty.penaltyPlayer.playerId].penaltyMinutes += penalty.penaltyMinutes ?? 0;
    }
  }

  return statsMap;
}

function applyStatsToRoster(
  players: RosterPlayer[],
  statsMap: Record<string, PlayerStatComputed>
): RosterPlayer[] {
  return players.map((rp) => {
    const pid = rp.player?.playerId;
    const computed = statsMap[pid] ?? { goals: 0, assists: 0, penaltyMinutes: 0 };
    return {
      ...rp,
      goals: computed.goals,
      assists: computed.assists,
      points: computed.goals + computed.assists,
      penaltyMinutes: computed.penaltyMinutes,
    };
  });
}

function accumulatePlayerAggregates(
  players: RosterPlayer[],
  team: Team,
  aggregates: Record<string, PlayerSeasonAggregate>
): void {
  for (const rp of players) {
    const pid = rp.player?.playerId;
    if (!pid) continue;

    const teamAlias: string = rp.calledFromTeam?.teamAlias ?? team.teamAlias ?? '';

    if (!aggregates[pid]) {
      aggregates[pid] = {
        teamAlias,
        stats: { gamesPlayed: 0, goals: 0, assists: 0, points: 0, penaltyMinutes: 0 },
      };
    }

    const agg = aggregates[pid].stats;
    agg.gamesPlayed += 1;
    agg.goals += rp.goals;
    agg.assists += rp.assists;
    agg.points += rp.points;
    agg.penaltyMinutes += rp.penaltyMinutes;
  }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  const { tournament, season } = (req.body ?? {}) as Partial<RecalcBody>;

  if (!tournament || !season) {
    return res.status(400).json({ error: 'Missing required fields: tournament and season' });
  }

  const accessToken = getAccessToken(req);
  if (!accessToken) {
    return res.status(401).json({ error: 'No access token provided' });
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const authHeader: Record<string, string> = { Authorization: `Bearer ${accessToken}` };
  const jsonHeaders: Record<string, string> = { ...authHeader, 'Content-Type': 'application/json' };

  const errors: string[] = [];
  let matchesProcessed = 0;
  const updatedPlayerIds = new Set<string>();
  const playerAggregates: Record<string, PlayerSeasonAggregate> = {};

  try {
    // 1. Fetch all FINISHED matches for the tournament + season (paginated)
    const allMatches: MatchValues[] = [];
    let page = 1;
    const pageSize = 50;

    while (true) {
      const matchRes = await fetch(
        `${apiUrl}/matches?tournament=${encodeURIComponent(tournament)}&season=${encodeURIComponent(season)}&matchStatus=FINISHED&page=${page}&page_size=${pageSize}`,
        { headers: authHeader }
      );

      if (!matchRes.ok) {
        const text = await matchRes.text();
        logApiError('recalc-stats', matchRes.status, `Failed to fetch matches page ${page}: ${text}`);
        return res.status(502).json({ error: `Failed to fetch matches: ${matchRes.status}` });
      }

      const matchData = (await matchRes.json()) as PaginatedMatchResponse | MatchValues[];
      const matches: MatchValues[] = Array.isArray(matchData)
        ? matchData
        : (matchData as PaginatedMatchResponse).data ?? [];

      if (matches.length === 0) break;
      allMatches.push(...matches);

      const pagination = Array.isArray(matchData) ? null : (matchData as PaginatedMatchResponse).pagination;
      if (!pagination?.has_next) break;
      page++;
    }

    // 2. Compute and patch match-level roster stats
    for (const match of allMatches) {
      const matchId: string = match._id;

      try {
        const sides: Array<{ key: 'home' | 'away'; team: Team }> = [
          { key: 'home', team: match.home },
          { key: 'away', team: match.away },
        ];

        const patchBody: Partial<Pick<MatchValues, 'home' | 'away'>> = {};

        for (const { key, team } of sides) {
          if (!team) continue;

          const statsMap = buildStatsMap(
            team.scores ?? [],
            team.penalties ?? []
          );

          const updatedPlayers = applyStatsToRoster(
            team.roster?.players ?? [],
            statsMap
          );

          accumulatePlayerAggregates(updatedPlayers, team, playerAggregates);

          patchBody[key] = {
            ...team,
            roster: {
              ...(team.roster ?? { players: [], status: 'DRAFT', published: false }),
              players: updatedPlayers,
            },
          };
        }

        const patchRes = await fetch(`${apiUrl}/matches/${matchId}`, {
          method: 'PATCH',
          headers: jsonHeaders,
          body: JSON.stringify(patchBody),
        });

        if (!patchRes.ok) {
          const text = await patchRes.text();
          errors.push(`Match ${matchId}: PATCH failed (${patchRes.status}) - ${text}`);
        } else {
          matchesProcessed++;
        }
      } catch (matchErr: unknown) {
        const msg = matchErr instanceof Error ? matchErr.message : String(matchErr);
        errors.push(`Match ${matchId}: ${msg}`);
      }
    }

    // 3. Aggregate and patch player card stats
    for (const [playerId, { teamAlias, stats: computed }] of Object.entries(playerAggregates)) {
      try {
        const playerRes = await fetch(`${apiUrl}/players/${playerId}`, {
          headers: authHeader,
        });

        if (!playerRes.ok) {
          errors.push(`Player ${playerId}: GET failed (${playerRes.status})`);
          continue;
        }

        const playerData = (await playerRes.json()) as PaginatedPlayerResponse | PlayerValues;
        const player: PlayerValues = 'data' in playerData && playerData.data
          ? playerData.data
          : playerData as PlayerValues;

        const existingStats = player.stats ?? [];
        const updatedStats = existingStats.filter(
          (s) => !(s.tournament?.alias === tournament && s.season?.alias === season)
        );

        updatedStats.push({
          tournament: { alias: tournament, name: tournament },
          season: { alias: season, name: season },
          round: { alias: '', name: '' },
          matchday: { alias: '', name: '' },
          team: { name: teamAlias, fullName: teamAlias, shortName: teamAlias, tinyName: teamAlias },
          gamesPlayed: computed.gamesPlayed,
          goals: computed.goals,
          assists: computed.assists,
          points: computed.points,
          penaltyMinutes: computed.penaltyMinutes,
        });

        const patchRes = await fetch(`${apiUrl}/players/${playerId}`, {
          method: 'PATCH',
          headers: jsonHeaders,
          body: JSON.stringify({ stats: updatedStats }),
        });

        if (!patchRes.ok) {
          const text = await patchRes.text();
          errors.push(`Player ${playerId}: PATCH failed (${patchRes.status}) - ${text}`);
        } else {
          updatedPlayerIds.add(playerId);
        }
      } catch (playerErr: unknown) {
        const msg = playerErr instanceof Error ? playerErr.message : String(playerErr);
        errors.push(`Player ${playerId}: ${msg}`);
      }
    }

    return res.status(200).json({
      matchesProcessed,
      playersUpdated: updatedPlayerIds.size,
      errors,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logApiError('recalc-stats', undefined, `Unexpected error: ${msg}`);
    return res.status(500).json({ error: 'Internal server error', details: msg });
  }
};

export default function recalcStatsRoute(req: NextApiRequest, res: NextApiResponse) {
  return withAnyRole(req, res, [UserRole.ADMIN, UserRole.LEAGUE_ADMIN], handler);
}
