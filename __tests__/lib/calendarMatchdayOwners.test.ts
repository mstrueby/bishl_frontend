import apiClient from '@/lib/apiClient';
import { calendarMatchdayKey, loadCalendarMatchdayOwners } from '@/lib/calendarMatchdayOwners';
import { calculateMatchButtonPermissions } from '@/tools/utils';
import type { MatchValues } from '@/types/MatchValues';

jest.mock('@/lib/apiClient', () => ({ __esModule: true, default: jest.fn() }));
const request = apiClient as jest.MockedFunction<typeof apiClient>;
const owner = { clubId: 'host', clubName: 'Host club', clubAlias: 'host' };

function match(overrides: Partial<MatchValues> = {}): MatchValues {
  return {
    _id: 'match',
    tournament: { name: 'League', alias: 'league' },
    season: { name: 'Season', alias: process.env.NEXT_PUBLIC_CURRENT_SEASON },
    round: { name: 'Round', alias: 'round' },
    matchday: { name: 'Day', alias: 'day' },
    startDate: new Date(),
    matchStatus: { key: 'SCHEDULED', value: 'Scheduled' },
    home: { clubId: 'home' },
    away: { clubId: 'away' },
    ...overrides,
  } as MatchValues;
}

describe('calendar matchday permissions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads ownership once for multiple matches on the same matchday', async () => {
    request.mockResolvedValue({ data: { owner } } as any);
    const first = match();
    const owners = await loadCalendarMatchdayOwners([first, match({ _id: 'second' })]);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(
      `/tournaments/league/seasons/${first.season.alias}/rounds/round/matchdays/day`,
    );
    expect(owners[calendarMatchdayKey(first)]).toEqual(owner);

    const hostPermissions = calculateMatchButtonPermissions(
      { roles: ['CLUB_ADMIN'], club: { clubId: 'host' } }, first,
      owners[calendarMatchdayKey(first)]!,
    );
    expect(hostPermissions.showButtonStatus).toBe(true);
    expect(hostPermissions.showButtonRosterHome).toBe(true);
    expect(hostPermissions.showButtonRosterAway).toBe(true);
    expect(hostPermissions.showButtonMatchCenter).toBe(true);

    const homePermissions = calculateMatchButtonPermissions(
      { roles: ['CLUB_ADMIN'], club: { clubId: 'home' } }, first,
      owners[calendarMatchdayKey(first)]!,
    );
    expect(homePermissions.showButtonRosterHome).toBe(true);
    expect(homePermissions.showButtonStatus).toBe(false);
    expect(homePermissions.showButtonRosterAway).toBe(false);
    expect(homePermissions.showButtonMatchCenter).toBe(false);
    const unrelated = calculateMatchButtonPermissions(
      { roles: ['CLUB_ADMIN'], club: { clubId: 'other' } }, first,
      owners[calendarMatchdayKey(first)]!,
    );
    expect(Object.values(unrelated).every(value => !value)).toBe(true);
  });

  it('isolates the same matchday alias across tournaments, seasons, and rounds', async () => {
    const matches = [
      match(),
      match({ tournament: { name: 'Other', alias: 'other' } }),
      match({ season: { name: 'Other', alias: 'other' } }),
      match({ round: { name: 'Other', alias: 'other' } }),
    ];
    matches.forEach((_, i) => request.mockResolvedValueOnce({
      data: { owner: { ...owner, clubId: `host-${i}` } },
    } as any));
    const owners = await loadCalendarMatchdayOwners(matches);
    expect(request).toHaveBeenCalledTimes(4);
    matches.forEach((item, i) => {
      expect(owners[calendarMatchdayKey(item)]?.clubId).toBe(`host-${i}`);
    });
  });

  it('preserves the home club fallback for a genuinely ownerless matchday', async () => {
    request.mockResolvedValue({ data: { owner: null } } as any);
    const first = match();
    const owners = await loadCalendarMatchdayOwners([first]);
    expect(owners[calendarMatchdayKey(first)]).toBeNull();
    const permissions = calculateMatchButtonPermissions(
      { roles: ['CLUB_ADMIN'], club: { clubId: 'home' } }, first,
      owners[calendarMatchdayKey(first)] || undefined,
    );
    expect(permissions.showButtonStatus).toBe(true);
    expect(permissions.showButtonRosterAway).toBe(true);
  });

  it('rejects failed owner lookups rather than returning ownerless permissions', async () => {
    request.mockRejectedValue(new Error('Unavailable'));
    await expect(loadCalendarMatchdayOwners([match()])).rejects.toThrow('Unavailable');
  });

  it('rejects malformed responses and makes no requests for an empty calendar', async () => {
    request.mockResolvedValue({ data: null } as any);
    await expect(loadCalendarMatchdayOwners([match()])).rejects.toThrow('Invalid calendar');
    request.mockClear();
    expect(await loadCalendarMatchdayOwners([])).toEqual({});
    expect(request).not.toHaveBeenCalled();
  });
});
