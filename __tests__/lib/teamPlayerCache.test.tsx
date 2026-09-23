import React, { StrictMode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiClient from '../../lib/apiClient';
import {
  TEAM_PLAYERS_FRESH_MS,
  teamPlayerKey,
  useTeamPlayers,
  updateCachedPlayer,
} from '../../lib/teamPlayerCache';

jest.mock('../../lib/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const get = apiClient.get as jest.Mock;
let counter = 0;

const responses = (playerName = 'Before') => {
  get.mockImplementation((url: string) => {
    if (url.startsWith('/clubs/id/')) return Promise.resolve({ data: { alias: 'club', name: 'Club' } });
    if (url.startsWith('/clubs/')) return Promise.resolve({ data: { name: 'Team' } });
    return Promise.resolve({ data: { results: [{ _id: 'p1', displayFirstName: playerName, assignedTeams: [] }] } });
  });
};

beforeEach(() => {
  get.mockReset();
  // Every test gets distinct keys so SWR's shared browser cache cannot leak across tests.
  counter += 1;
});

const playerRequests = () => get.mock.calls.filter(([url]) => url.startsWith('/players/clubs/')).length;

test('fresh navigation renders the cached list immediately without another players request, including Strict Mode remount', async () => {
  responses();
  const alias = `fresh-${counter}`;
  const wrapper = ({ children }: { children: React.ReactNode }) => <StrictMode>{children}</StrictMode>;
  const first = renderHook(() => useTeamPlayers('club-id', alias), { wrapper });
  await waitFor(() => expect(first.result.current.data?.players[0].displayFirstName).toBe('Before'));
  expect(playerRequests()).toBe(1);
  first.unmount();

  const back = renderHook(() => useTeamPlayers('club-id', alias), { wrapper });
  expect(back.result.current.data?.players[0].displayFirstName).toBe('Before');
  await act(async () => {});
  expect(playerRequests()).toBe(1);
  back.unmount();
});

test('a stale list stays visible during one refresh, and failed refresh retains it with an error', async () => {
  responses();
  const alias = `stale-${counter}`;
  const first = renderHook(() => useTeamPlayers('club-id', alias));
  await waitFor(() => expect(first.result.current.data).toBeDefined());
  first.unmount();
  const now = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + TEAM_PLAYERS_FRESH_MS + 1);
  let rejectRefresh!: (reason: Error) => void;
  get.mockImplementation((url: string) => {
    if (url.startsWith('/clubs/id/')) return new Promise((_, reject) => { rejectRefresh = reject; });
    throw new Error('Unexpected request');
  });

  const back = renderHook(() => useTeamPlayers('club-id', alias));
  expect(back.result.current.data?.players[0].displayFirstName).toBe('Before');
  await waitFor(() => expect(back.result.current.isValidating).toBe(true));
  expect(get.mock.calls.filter(([url]) => url.startsWith('/clubs/id/'))).toHaveLength(2);
  await act(async () => rejectRefresh(new Error('Offline')));
  await waitFor(() => expect(back.result.current.error?.message).toBe('Offline'));
  expect(back.result.current.data?.players[0].displayFirstName).toBe('Before');
  back.unmount();
  now.mockRestore();
});

test('an expired list refreshes once and replaces the cached result when successful', async () => {
  responses();
  const alias = `expired-${counter}`;
  const first = renderHook(() => useTeamPlayers('club-id', alias));
  await waitFor(() => expect(first.result.current.data).toBeDefined());
  first.unmount();
  const now = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + TEAM_PLAYERS_FRESH_MS + 1);
  let finish!: (value: unknown) => void;
  get.mockImplementation((url: string) => {
    if (url.startsWith('/clubs/id/')) return new Promise(resolve => { finish = resolve; });
    if (url.startsWith('/clubs/')) return Promise.resolve({ data: { name: 'Team' } });
    return Promise.resolve({ data: { results: [{ _id: 'p1', displayFirstName: 'Fresh' }] } });
  });
  const back = renderHook(() => useTeamPlayers('club-id', alias));
  expect(back.result.current.data?.players[0].displayFirstName).toBe('Before');
  await waitFor(() => expect(back.result.current.isValidating).toBe(true));
  await act(async () => finish({ data: { alias: 'club', name: 'Club' } }));
  await waitFor(() => expect(back.result.current.data?.players[0].displayFirstName).toBe('Fresh'));
  expect(playerRequests()).toBe(2);
  now.mockRestore();
  back.unmount();
});

test('an initial failure can be retried explicitly', async () => {
  const alias = `retry-${counter}`;
  get.mockRejectedValueOnce(new Error('Offline'));
  const view = renderHook(() => useTeamPlayers('club-id', alias));
  await waitFor(() => expect(view.result.current.error?.message).toBe('Offline'));
  expect(view.result.current.data).toBeUndefined();
  responses('Recovered');
  await act(async () => {
    await view.result.current.refresh();
  });
  await waitFor(() => expect(view.result.current.data?.players[0].displayFirstName).toBe('Recovered'));
  view.unmount();
});

test('club and team keys are isolated', async () => {
  expect(teamPlayerKey('a:b', 'c')).not.toBe(teamPlayerKey('a', 'b:c'));
  responses();
  const alias = `isolate-${counter}`;
  const first = renderHook(({ club }) => useTeamPlayers(club, alias), {
    initialProps: { club: 'club-a' },
  });
  await waitFor(() => expect(first.result.current.data).toBeDefined());
  first.rerender({ club: 'club-b' });
  expect(first.result.current.data).toBeUndefined();
  await waitFor(() => expect(first.result.current.data).toBeDefined());
  expect(playerRequests()).toBe(2);
  first.unmount();
});

test('successful edit mutation updates only its team without refetching', async () => {
  responses();
  const alias = `edit-${counter}`;
  const first = renderHook(() => useTeamPlayers('club-a', alias));
  await waitFor(() => expect(first.result.current.data).toBeDefined());
  await act(async () => {
    await updateCachedPlayer('club-a', alias, 'p1', { displayFirstName: 'After', assignedTeams: [] });
  });
  expect(first.result.current.data?.players[0].displayFirstName).toBe('After');
  expect(playerRequests()).toBe(1);
  first.unmount();
  const back = renderHook(() => useTeamPlayers('club-a', alias));
  expect(back.result.current.data?.players[0].displayFirstName).toBe('After');
  back.unmount();
});

test('a mutation wins over a pending background refresh', async () => {
  responses();
  const alias = `race-${counter}`;
  const first = renderHook(() => useTeamPlayers('club-a', alias));
  await waitFor(() => expect(first.result.current.data).toBeDefined());
  let finish!: (value: unknown) => void;
  get.mockImplementation((url: string) => {
    if (url.startsWith('/clubs/id/')) return new Promise(resolve => { finish = resolve; });
    if (url.startsWith('/clubs/')) return Promise.resolve({ data: { name: 'Team' } });
    return Promise.resolve({ data: { results: [{ _id: 'p1', displayFirstName: 'Obsolete' }] } });
  });
  await act(async () => {
    void first.result.current.refresh();
  });
  await waitFor(() => expect(first.result.current.isValidating).toBe(true));
  await act(async () => {
    await updateCachedPlayer('club-a', alias, 'p1', { displayFirstName: 'Saved' });
    finish({ data: { alias: 'club', name: 'Club' } });
  });
  await waitFor(() => expect(first.result.current.isValidating).toBe(false));
  expect(first.result.current.data?.players[0].displayFirstName).toBe('Saved');
  first.unmount();
});