import { NextApiRequest, NextApiResponse } from 'next';
import { withAnyRole, getAccessToken } from '../../../lib/serverAuth';
import { UserRole } from '../../../lib/auth';
import { logApiError } from '../../../lib/apiLogger';

interface RecalcBody {
  tournament: string;
  season: string;
}

interface PlayerStatAggregate {
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  penaltyMinutes: number;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  const { tournament, season } = req.body as Partial<RecalcBody>;

  if (!tournament || !season) {
    return res.status(400).json({ error: 'Missing required fields: tournament and season' });
  }

  const accessToken = getAccessToken(req);
  if (!accessToken) {
    return res.status(401).json({ error: 'No access token provided' });
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const authHeader = { Authorization: `Bearer ${accessToken}` };

  const errors: string[] = [];
  let matchesProcessed = 0;
  const updatedPlayerIds = new Set<string>();

  // Per-player aggregate across all matches: playerId -> teamAlias -> stats
  const playerAggregates: Record<
    string,
    { teamAlias: string; stats: PlayerStatAggregate }
  > = {};

  try {
    // 1. Fetch all finished matches for the tournament + season
    let allMatches: any[] = [];
    let page = 1;
    const pageSize = 50;

    while (true) {
      const matchRes = await fetch(
        `${apiUrl}/matches?tournament=${tournament}&season=${season}&matchStatus=FINISHED&page=${page}&pageSize=${pageSize}`,
        { headers: authHeader }
      );

      if (!matchRes.ok) {
        const text = await matchRes.text();
        logApiError('recalc-stats', matchRes.status, `Failed to fetch matches page ${page}: ${text}`);
        return res.status(502).json({ error: `Failed to fetch matches: ${matchRes.status}` });
      }

      const matchData = await matchRes.json();
      const matches: any[] = matchData?.data ?? matchData ?? [];

      if (!Array.isArray(matches) || matches.length === 0) break;

      allMatches = allMatches.concat(matches);

      const pagination = matchData?.pagination;
      if (!pagination || !pagination.has_next) break;
      page++;
    }

    // 2. Process each match
    for (const match of allMatches) {
      const matchId: string = match._id;

      try {
        const sides = [
          { sideKey: 'home', team: match.home },
          { sideKey: 'away', team: match.away },
        ];

        const updatedSides: Record<string, any> = {};

        for (const { sideKey, team } of sides) {
          if (!team) continue;

          // Build playerId -> computed stats map from scores and penalties
          const statsMap: Record<string, { goals: number; assists: number; penaltyMinutes: number }> = {};

          const initPlayer = (pid: string) => {
            if (!statsMap[pid]) statsMap[pid] = { goals: 0, assists: 0, penaltyMinutes: 0 };
          };

          for (const score of team.scores ?? []) {
            if (score.goalPlayer?.playerId) {
              initPlayer(score.goalPlayer.playerId);
              statsMap[score.goalPlayer.playerId].goals += 1;
            }
            if (score.assistPlayer?.playerId) {
              initPlayer(score.assistPlayer.playerId);
              statsMap[score.assistPlayer.playerId].assists += 1;
            }
          }

          for (const penalty of team.penalties ?? []) {
            if (penalty.penaltyPlayer?.playerId) {
              initPlayer(penalty.penaltyPlayer.playerId);
              statsMap[penalty.penaltyPlayer.playerId].penaltyMinutes += penalty.penaltyMinutes ?? 0;
            }
          }

          // Merge onto roster players
          const updatedPlayers = (team.roster?.players ?? []).map((rp: any) => {
            const pid: string = rp.player?.playerId;
            const computed = statsMap[pid] ?? { goals: 0, assists: 0, penaltyMinutes: 0 };
            return {
              ...rp,
              goals: computed.goals,
              assists: computed.assists,
              points: computed.goals + computed.assists,
              penaltyMinutes: computed.penaltyMinutes,
            };
          });

          updatedSides[sideKey] = {
            ...team,
            roster: {
              ...(team.roster ?? {}),
              players: updatedPlayers,
            },
          };

          // Accumulate per-player season aggregates
          for (const rp of updatedPlayers) {
            const pid: string = rp.player?.playerId;
            if (!pid) continue;

            // Determine which team this player is playing for (use assigned team alias or team alias)
            const teamAlias: string =
              rp.calledFromTeam?.teamAlias ?? team.teamAlias ?? '';

            if (!playerAggregates[pid]) {
              playerAggregates[pid] = { teamAlias, stats: { gamesPlayed: 0, goals: 0, assists: 0, points: 0, penaltyMinutes: 0 } };
            }
            const agg = playerAggregates[pid].stats;
            agg.gamesPlayed += 1;
            agg.goals += rp.goals;
            agg.assists += rp.assists;
            agg.points += rp.points;
            agg.penaltyMinutes += rp.penaltyMinutes;
          }
        }

        // PATCH the match with updated rosters
        const patchBody: Record<string, any> = {};
        if (updatedSides.home) patchBody.home = updatedSides.home;
        if (updatedSides.away) patchBody.away = updatedSides.away;

        if (Object.keys(patchBody).length > 0) {
          const patchRes = await fetch(`${apiUrl}/matches/${matchId}`, {
            method: 'PATCH',
            headers: { ...authHeader, 'Content-Type': 'application/json' },
            body: JSON.stringify(patchBody),
          });

          if (!patchRes.ok) {
            const text = await patchRes.text();
            errors.push(`Match ${matchId}: PATCH failed (${patchRes.status}) - ${text}`);
          } else {
            matchesProcessed++;
          }
        } else {
          matchesProcessed++;
        }
      } catch (matchErr: any) {
        errors.push(`Match ${matchId}: ${matchErr?.message ?? String(matchErr)}`);
      }
    }

    // 3. Aggregate and patch player card stats
    for (const [playerId, { teamAlias, stats: computed }] of Object.entries(playerAggregates)) {
      try {
        // Fetch current player record
        const playerRes = await fetch(`${apiUrl}/players/${playerId}`, {
          headers: authHeader,
        });

        if (!playerRes.ok) {
          errors.push(`Player ${playerId}: GET failed (${playerRes.status})`);
          continue;
        }

        const playerData = await playerRes.json();
        const player: any = playerData?.data ?? playerData;

        // Replace/insert the stats entry for this tournament + season (keep others intact)
        const existingStats: any[] = player.stats ?? [];
        const updatedStats = existingStats.filter(
          (s: any) =>
            !(s.tournament?.alias === tournament && s.season?.alias === season)
        );

        updatedStats.push({
          tournament: { alias: tournament, name: tournament },
          season: { alias: season, name: season },
          team: { name: teamAlias, fullName: teamAlias, shortName: teamAlias, tinyName: teamAlias },
          gamesPlayed: computed.gamesPlayed,
          goals: computed.goals,
          assists: computed.assists,
          points: computed.points,
          penaltyMinutes: computed.penaltyMinutes,
        });

        const patchRes = await fetch(`${apiUrl}/players/${playerId}`, {
          method: 'PATCH',
          headers: { ...authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify({ stats: updatedStats }),
        });

        if (!patchRes.ok) {
          const text = await patchRes.text();
          errors.push(`Player ${playerId}: PATCH failed (${patchRes.status}) - ${text}`);
        } else {
          updatedPlayerIds.add(playerId);
        }
      } catch (playerErr: any) {
        errors.push(`Player ${playerId}: ${playerErr?.message ?? String(playerErr)}`);
      }
    }

    return res.status(200).json({
      matchesProcessed,
      playersUpdated: updatedPlayerIds.size,
      errors,
    });
  } catch (err: any) {
    logApiError('recalc-stats', undefined, `Unexpected error: ${err?.message}`);
    return res.status(500).json({ error: 'Internal server error', details: err?.message });
  }
};

export default function recalcStatsRoute(req: NextApiRequest, res: NextApiResponse) {
  return withAnyRole(req, res, [UserRole.ADMIN, UserRole.LEAGUE_ADMIN], handler);
}
