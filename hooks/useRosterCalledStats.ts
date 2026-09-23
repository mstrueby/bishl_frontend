import { useCallback, useEffect, useRef, useState } from 'react';
import { PlayerValues } from '../types/PlayerValues';
import { CallUpType } from '../types/TournamentValues';
import { countCalledMatches } from '../utils/countCalledMatches';

export interface CalledStatsContext {
  matchId: string;
  teamFlag: string;
  tournamentAlias: string;
  seasonAlias: string;
  callUpType: CallUpType;
  matchdayId?: string;
}

interface StatsState {
  key: string | null;
  counts: Record<string, number>;
  errors: Record<string, boolean>;
}

export function useRosterCalledStats(
  calledIds: string[],
  context: CalledStatsContext | null,
  loadPlayer: (playerId: string) => Promise<PlayerValues>,
) {
  // Jersey, position and selection changes to other players do not change this key.
  const idsKey = JSON.stringify([...new Set(calledIds)].sort());
  const contextKey = context ? JSON.stringify(context) : null;
  const ids = useRef(new Set<string>());
  ids.current = new Set(JSON.parse(idsKey) as string[]);
  const activeContext = useRef<string | null>(null);
  const requested = useRef(new Set<string>());
  const generation = useRef(0);
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<StatsState>({ key: null, counts: {}, errors: {} });
  const counts = state.key === contextKey ? state.counts : {};
  const errors = state.key === contextKey ? state.errors : {};

  useEffect(() => {
    if (activeContext.current !== contextKey) {
      activeContext.current = contextKey;
      requested.current.clear();
      generation.current++;
      setState({ key: contextKey, counts: {}, errors: {} });
    }
    if (!context || !contextKey) return;
    for (const playerId of requested.current) {
      if (!ids.current.has(playerId)) requested.current.delete(playerId);
    }
    const version = generation.current;
    const currentCounts = state.key === contextKey ? state.counts : {};
    const currentErrors = state.key === contextKey ? state.errors : {};

    for (const playerId of ids.current) {
      if (currentCounts[playerId] !== undefined || currentErrors[playerId] || requested.current.has(playerId)) continue;
      requested.current.add(playerId);
      void loadPlayer(playerId).then(
        player => {
          if (activeContext.current !== contextKey || generation.current !== version || !ids.current.has(playerId)) return;
          const count = countCalledMatches(
            player, context.tournamentAlias, context.seasonAlias, context.callUpType, context.matchdayId,
          );
          setState(prev => prev.key === contextKey && prev.counts[playerId] === undefined
            ? { ...prev, counts: { ...prev.counts, [playerId]: count } }
            : prev);
        },
        () => {
          if (activeContext.current !== contextKey || generation.current !== version || !ids.current.has(playerId)) return;
          // A failed request is unknown, never zero. Retry is explicit.
          setState(prev => prev.key === contextKey
            ? { ...prev, errors: { ...prev.errors, [playerId]: true } }
            : prev);
        },
      );
    }
  }, [idsKey, contextKey, revision, loadPlayer]); // eslint-disable-line react-hooks/exhaustive-deps

  const seed = useCallback((playerId: string, count: number) => {
    if (!contextKey) return;
    requested.current.add(playerId);
    setState(prev => ({
      key: contextKey,
      counts: { ...(prev.key === contextKey ? prev.counts : {}), [playerId]: count },
      errors: prev.key === contextKey ? prev.errors : {},
    }));
  }, [contextKey]);

  const retry = useCallback((playerId: string) => {
    requested.current.delete(playerId);
    setState(prev => prev.key === contextKey
      ? { ...prev, errors: { ...prev.errors, [playerId]: false } }
      : prev);
    setRevision(value => value + 1);
  }, [contextKey]);

  // A saved roster may change play-up tracking on the server.
  const invalidate = useCallback(() => {
    generation.current++;
    requested.current.clear();
    setState({ key: contextKey, counts: {}, errors: {} });
    setRevision(value => value + 1);
  }, [contextKey]);

  return { counts, errors, seed, retry, invalidate };
}