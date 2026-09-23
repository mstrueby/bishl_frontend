import React, { StrictMode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useRosterCalledStats, CalledStatsContext } from '../../hooks/useRosterCalledStats';
import { PlayerValues } from '../../types/PlayerValues';
import { CallUpType } from '../../types/TournamentValues';

const context: CalledStatsContext = {
  matchId: 'match-1',
  teamFlag: 'home',
  tournamentAlias: 'league',
  seasonAlias: 'season',
  callUpType: CallUpType.MATCH,
};

const player = (id: string, count: number): PlayerValues => ({
  _id: id,
  playUpTrackings: [{
    tournamentAlias: 'league',
    seasonAlias: 'season',
    fromTeamId: 'one',
    toTeamId: 'two',
    occurrences: Array.from({ length: count }, (_, index) => ({
      counted: true,
      matchId: `match-${index}`,
      matchdayId: `day-${index}`,
    })),
  }],
} as PlayerValues);

test('jersey and unrelated roster edits do not refetch existing called-up players', async () => {
  const load = jest.fn(async (id: string) => player(id, 2));
  const hook = renderHook(
    ({ ids, jersey }) => useRosterCalledStats(ids, { ...context }, load),
    { initialProps: { ids: ['called-1'], jersey: 10 } },
  );
  await waitFor(() => expect(hook.result.current.counts['called-1']).toBe(2));
  hook.rerender({ ids: ['called-1'], jersey: 11 });
  hook.rerender({ ids: ['called-1'], jersey: 12 });
  expect(load).toHaveBeenCalledTimes(1);
  hook.rerender({ ids: ['called-1', 'called-2'], jersey: 12 });
  await waitFor(() => expect(hook.result.current.counts['called-2']).toBe(2));
  expect(load.mock.calls.map(([id]) => id)).toEqual(['called-1', 'called-2']);
  hook.unmount();
});

test('a count supplied by the call-up list prevents another detail request', async () => {
  const load = jest.fn(async (id: string) => player(id, 3));
  const hook = renderHook(({ ids }) => useRosterCalledStats(ids, context, load), {
    initialProps: { ids: [] as string[] },
  });
  act(() => hook.result.current.seed('called-1', 3));
  hook.rerender({ ids: ['called-1'] });
  expect(hook.result.current.counts['called-1']).toBe(3);
  expect(load).not.toHaveBeenCalled();
  hook.unmount();
});

test('a failed count remains unknown until an explicit retry succeeds', async () => {
  const load = jest.fn()
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce(player('called-1', 4));
  const hook = renderHook(() => useRosterCalledStats(['called-1'], context, load));
  await waitFor(() => expect(hook.result.current.errors['called-1']).toBe(true));
  expect(hook.result.current.counts['called-1']).toBeUndefined();
  expect(load).toHaveBeenCalledTimes(1);
  act(() => hook.result.current.retry('called-1'));
  await waitFor(() => expect(hook.result.current.counts['called-1']).toBe(4));
  expect(load).toHaveBeenCalledTimes(2);
  hook.unmount();
});

test('a new matchday context discards an obsolete response and recalculates', async () => {
  let finishFirst!: (value: PlayerValues) => void;
  const load = jest.fn()
    .mockImplementationOnce(() => new Promise<PlayerValues>(resolve => { finishFirst = resolve; }))
    .mockResolvedValueOnce(player('called-1', 3));
  const hook = renderHook(
    ({ matchdayId }) => useRosterCalledStats(['called-1'], {
      ...context, callUpType: CallUpType.MATCHDAY, matchdayId,
    }, load),
    { initialProps: { matchdayId: 'day-1' } },
  );
  await waitFor(() => expect(load).toHaveBeenCalledTimes(1));
  hook.rerender({ matchdayId: 'day-2' });
  await waitFor(() => expect(hook.result.current.counts['called-1']).toBe(2));
  act(() => finishFirst(player('called-1', 5)));
  await act(async () => {});
  expect(hook.result.current.counts['called-1']).toBe(2);
  hook.unmount();
});

test('saving a roster can invalidate and recalculate selected call-up counts', async () => {
  const load = jest.fn()
    .mockResolvedValueOnce(player('called-1', 1))
    .mockResolvedValueOnce(player('called-1', 2));
  const hook = renderHook(() => useRosterCalledStats(['called-1'], context, load));
  await waitFor(() => expect(hook.result.current.counts['called-1']).toBe(1));
  act(() => hook.result.current.invalidate());
  await waitFor(() => expect(hook.result.current.counts['called-1']).toBe(2));
  expect(load).toHaveBeenCalledTimes(2);
  hook.unmount();
});

test('Strict Mode effect replay still starts only one request per called player', async () => {
  let resolve!: (value: PlayerValues) => void;
  const load = jest.fn(() => new Promise<PlayerValues>(done => { resolve = done; }));
  const wrapper = ({ children }: { children: React.ReactNode }) => <StrictMode>{children}</StrictMode>;
  const hook = renderHook(() => useRosterCalledStats(['called-1'], context, load), { wrapper });
  expect(load).toHaveBeenCalledTimes(1);
  await act(async () => resolve(player('called-1', 1)));
  await waitFor(() => expect(hook.result.current.counts['called-1']).toBe(1));
  hook.unmount();
});