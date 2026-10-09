import { render } from '@testing-library/react';
import Calendar, { getStaticProps } from '@/pages/calendar';
import apiClient from '@/lib/apiClient';
import MatchCard from '@/components/ui/MatchCard';
import { calendarMatchdayKey } from '@/lib/calendarMatchdayOwners';
import type { MatchValues } from '@/types/MatchValues';

jest.mock('@/lib/apiClient', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/components/Layout', () => ({
  __esModule: true, default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/components/ui/MatchCard', () => ({ __esModule: true, default: jest.fn(() => null) }));
jest.mock('@/components/ui/ClubSelect', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/ui/TeamSelect', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/ui/VenueSelect', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/ui/TournamentSelect', () => ({ __esModule: true, default: () => null }));

const owner = { clubId: 'host', clubName: 'Host', clubAlias: 'host' };
const match = {
  _id: 'match',
  startDate: new Date().toISOString(),
  tournament: { name: 'League', alias: 'league' },
  season: { name: 'Season', alias: 'season' },
  round: { name: 'Round', alias: 'round' },
  matchday: { name: 'Day', alias: 'day' },
  venue: { name: 'Arena' },
  home: { clubId: 'home' },
  away: { clubId: 'away' },
} as unknown as MatchValues;
const request = apiClient as jest.MockedFunction<typeof apiClient>;

describe('calendar ownership integration', () => {
  beforeEach(() => jest.clearAllMocks());

  it('passes the resolved owner to the selected date MatchCard', () => {
    render(<Calendar matches={[match]} venues={[]} clubs={[]} tournaments={[]}
      matchdayOwners={{ [calendarMatchdayKey(match)]: owner }} />);
    expect(MatchCard).toHaveBeenCalled();
    expect((MatchCard as jest.Mock).mock.calls[0][0]).toEqual(expect.objectContaining({
      match, matchdayOwner: owner, from: 'calendar',
    }));
  });

  it('includes authoritative ownership in static calendar props', async () => {
    request.mockImplementation(async (url: any) => ({
      data: url === '/matches/calendar' ? [match]
        : url.includes('/matchdays/') ? { owner } : [],
    }) as any);
    const result = await getStaticProps({});
    expect(result).toEqual(expect.objectContaining({
      props: expect.objectContaining({
        matches: [match],
        matchdayOwners: { [calendarMatchdayKey(match)]: owner },
      }),
      revalidate: 60,
    }));
  });

  it('does not cache ownerless permissions or a 404 after an owner lookup fails', async () => {
    request.mockImplementation(async (url: any) => {
      if (url.includes('/matchdays/')) {
        throw Object.assign(new Error('Owner lookup failed'), { response: { status: 404 } });
      }
      return { data: url === '/matches/calendar' ? [match] : [] } as any;
    });
    await expect(getStaticProps({})).rejects.toThrow('Owner lookup failed');
  });
});
