
import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import { Fragment, useState } from 'react';
import { useRouter } from 'next/router';
import { Tab } from '@headlessui/react';
import Layout from '../../../../../components/Layout';
import apiClient from '../../../../../lib/apiClient';
import Link from 'next/link';
import { RoundValues, MatchdayValues, MatchValues } from '../../../../../types/TournamentValues';
import Standings from '../../../../../components/ui/Standings';
import MatchCard from '../../../../../components/ui/MatchCard';

interface RoundOverviewProps {
  round: RoundValues;
  matchdays: MatchdayValues[];
  matches: MatchValues[];
  allRounds: RoundValues[];
  tAlias: string;
  sAlias: string;
  rAlias: string;
  tournamentName: string;
  seasonName: string;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function RoundOverview({
  round,
  matchdays,
  matches,
  allRounds,
  tAlias,
  sAlias,
  rAlias,
  tournamentName,
  seasonName
}: RoundOverviewProps) {
  const router = useRouter();
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  const hasStandings = round.createStandings && round.standings && round.standings.length > 0;
  const hasSingleMatchday = matchdays.length === 1;
  const showTabs = hasSingleMatchday || hasStandings;

  // Get unique teams for filter
  const teams = Array.from(
    new Set(
      matches.flatMap(m => [
        m.homeTeam.shortName,
        m.awayTeam.shortName
      ])
    )
  ).sort();

  // Filter matches by selected team
  const filteredMatches = selectedTeam
    ? matches.filter(m =>
        m.homeTeam.shortName === selectedTeam || m.awayTeam.shortName === selectedTeam
      )
    : matches;

  const handleRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`/tournaments/${tAlias}/${sAlias}/${e.target.value}`);
  };

  return (
    <Layout>
      <Head>
        <title>{round.name} - {seasonName} - {tournamentName} | BISHL</title>
        <meta
          name="description"
          content={`${round.name} der Saison ${seasonName} im ${tournamentName}. Spielplan und Tabelle.`}
        />
        <link
          rel="canonical"
          href={`${process.env.NEXT_PUBLIC_BASE_URL}/tournaments/${tAlias}/${sAlias}/${rAlias}`}
        />
      </Head>

      {/* Breadcrumb */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/" className="text-sm font-medium text-gray-700 hover:text-indigo-600">
              Home
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="w-3 h-3 text-gray-400 mx-1" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
              </svg>
              <Link href="/tournaments" className="ml-1 text-sm font-medium text-gray-700 hover:text-indigo-600">
                Wettbewerbe
              </Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="w-3 h-3 text-gray-400 mx-1" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
              </svg>
              <Link href={`/tournaments/${tAlias}`} className="ml-1 text-sm font-medium text-gray-700 hover:text-indigo-600">
                {tournamentName}
              </Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="w-3 h-3 text-gray-400 mx-1" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
              </svg>
              <Link href={`/tournaments/${tAlias}/${sAlias}`} className="ml-1 text-sm font-medium text-gray-700 hover:text-indigo-600">
                {seasonName}
              </Link>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg className="w-3 h-3 text-gray-400 mx-1" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
              </svg>
              <span className="ml-1 text-sm font-medium text-gray-500">{round.name}</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header with Round Selector */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <h2 className="text-2xl font-medium uppercase text-gray-900 sm:text-3xl tracking-wider">
          {round.name}
        </h2>
        
        {allRounds.length > 1 && (
          <div className="mt-4 sm:mt-0">
            <select
              value={rAlias}
              onChange={handleRoundChange}
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              {allRounds.map((r) => (
                <option key={r.alias} value={r.alias}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content with conditional tabs */}
      {!showTabs ? (
        // No tabs - just show matchdays list
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Spieltage</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matchdays.map((matchday) => (
              <Link
                key={matchday.alias}
                href={`/tournaments/${tAlias}/${sAlias}/${rAlias}/${matchday.alias}`}
                className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-medium text-gray-900">{matchday.name}</p>
                  {matchday.startDate && (
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(matchday.startDate).toLocaleDateString('de-DE')}
                    </p>
                  )}
                </div>
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        // Show tabs
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-indigo-100 p-1 mb-8">
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-indigo-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white shadow text-indigo-700'
                    : 'text-indigo-600 hover:bg-white/[0.12] hover:text-indigo-800'
                )
              }
            >
              {hasSingleMatchday ? 'Spiele' : 'Spieltage'}
            </Tab>
            {hasStandings && (
              <Tab
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-indigo-400 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-white shadow text-indigo-700'
                      : 'text-indigo-600 hover:bg-white/[0.12] hover:text-indigo-800'
                  )
                }
              >
                Tabelle
              </Tab>
            )}
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel>
              {hasSingleMatchday ? (
                // Show matches directly
                <div>
                  {teams.length > 0 && (
                    <div className="mb-6">
                      <label htmlFor="team-filter" className="block text-sm font-medium text-gray-700 mb-2">
                        Nach Team filtern
                      </label>
                      <select
                        id="team-filter"
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        className="block w-full max-w-xs rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="">Alle Teams</option>
                        {teams.map((team) => (
                          <option key={team} value={team}>
                            {team}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {filteredMatches.map((match) => (
                      <MatchCard key={match.matchId} match={match} />
                    ))}
                  </div>
                  
                  {filteredMatches.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">
                        {selectedTeam ? 'Keine Spiele für dieses Team' : 'Keine Spiele verfügbar'}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                // Show matchdays list
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {matchdays.map((matchday) => (
                    <Link
                      key={matchday.alias}
                      href={`/tournaments/${tAlias}/${sAlias}/${rAlias}/${matchday.alias}`}
                      className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-medium text-gray-900">{matchday.name}</p>
                        {matchday.startDate && (
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(matchday.startDate).toLocaleDateString('de-DE')}
                          </p>
                        )}
                      </div>
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  ))}
                </div>
              )}
            </Tab.Panel>
            
            {hasStandings && (
              <Tab.Panel>
                <div className="mb-4">
                  <Link
                    href={`/tournaments/${tAlias}/${sAlias}/${rAlias}/standings`}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Tabelle teilen →
                  </Link>
                </div>
                <Standings standings={round.standings!} />
              </Tab.Panel>
            )}
          </Tab.Panels>
        </Tab.Group>
      )}
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths: any[] = [];
  return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { tAlias, sAlias, rAlias } = params as { tAlias: string; sAlias: string; rAlias: string };

  try {
    const [roundResponse, matchdaysResponse, allRoundsResponse, tournamentResponse, seasonResponse] = await Promise.all([
      apiClient.get(`/tournaments/${tAlias}/seasons/${sAlias}/rounds/${rAlias}`),
      apiClient.get(`/tournaments/${tAlias}/seasons/${sAlias}/rounds/${rAlias}/matchdays`),
      apiClient.get(`/tournaments/${tAlias}/seasons/${sAlias}/rounds`),
      apiClient.get(`/tournaments/${tAlias}`),
      apiClient.get(`/tournaments/${tAlias}/seasons/${sAlias}`)
    ]);

    const round = roundResponse.data;
    const matchdays = matchdaysResponse.data || [];
    const allRounds = allRoundsResponse.data || [];

    // Auto-redirect to latest matchday if multiple matchdays exist
    if (matchdays.length > 1) {
      const sortedMatchdays = matchdays
        .filter((md: MatchdayValues) => md.published)
        .sort((a: MatchdayValues, b: MatchdayValues) => {
          if (a.startDate && b.startDate) {
            return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
          }
          return b.alias.localeCompare(a.alias);
        });

      if (sortedMatchdays.length > 0) {
        return {
          redirect: {
            destination: `/tournaments/${tAlias}/${sAlias}/${rAlias}/${sortedMatchdays[0].alias}`,
            permanent: false,
          },
        };
      }
    }

    // If single matchday, fetch matches
    let matches: MatchValues[] = [];
    if (matchdays.length === 1) {
      try {
        const matchesResponse = await apiClient.get(
          `/tournaments/${tAlias}/seasons/${sAlias}/rounds/${rAlias}/matchdays/${matchdays[0].alias}/matches`
        );
        matches = matchesResponse.data || [];
      } catch (error) {
        console.error('Error fetching matches:', error);
      }
    }

    return {
      props: {
        round,
        matchdays,
        matches,
        allRounds: allRounds.filter((r: RoundValues) => r.published).sort((a: RoundValues, b: RoundValues) => b.alias.localeCompare(a.alias)),
        tAlias,
        sAlias,
        rAlias,
        tournamentName: tournamentResponse.data?.name || tAlias,
        seasonName: seasonResponse.data?.name || sAlias,
      },
      revalidate: 300,
    };
  } catch (error) {
    console.error('Error fetching round data:', error);
    return { notFound: true };
  }
};
