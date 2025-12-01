
import { GetStaticPropsContext } from 'next';
import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { CheckIcon } from '@heroicons/react/20/solid';
import Layout from '../../../../../../components/Layout';
import { MatchdayValues } from '../../../../../../types/TournamentValues';
import MatchCard from '../../../../../../components/ui/MatchCard';
import Standings from '../../../../../../components/ui/Standings';
import apiClient from '../../../../../../lib/apiClient';

interface MatchdayDetailProps {
  matchday: MatchdayValues;
  tAlias: string;
  sAlias: string;
  rAlias: string;
  mdAlias: string;
  tournamentName: string;
  seasonName: string;
  roundName: string;
  standings?: any; // TODO: Add proper standings type
  stats?: any; // TODO: Add proper stats type
}

type TabKey = 'matches' | 'standings' | 'stats';

export default function MatchdayDetail({
  matchday,
  tAlias,
  sAlias,
  rAlias,
  mdAlias,
  tournamentName,
  seasonName,
  roundName,
  standings,
  stats
}: MatchdayDetailProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('matches');

  // Sort matches by start time
  const sortedMatches = matchday.matches
    ? matchday.matches
        .slice()
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    : [];

  // Group matches by date
  const matchesByDate = sortedMatches.reduce((acc, match) => {
    const dateKey = new Date(match.startTime).toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(match);
    return acc;
  }, {} as Record<string, typeof sortedMatches>);

  const tabs = [
    { key: 'matches' as TabKey, caption: 'Spiele' },
    { key: 'standings' as TabKey, caption: 'Tabelle' },
    { key: 'stats' as TabKey, caption: 'Statistiken' }
  ];

  function classNames(...classes: string[]): string {
    return classes.filter(Boolean).join(' ');
  }

  return (
    <Layout>
      <Head>
        <title>{matchday.name} - {roundName} - {seasonName} - {tournamentName} | BISHL</title>
        <meta
          name="description"
          content={`${matchday.name} im ${roundName} der Saison ${seasonName} (${tournamentName}). Spiele, Tabelle und Statistiken.`}
        />
        <link
          rel="canonical"
          href={`${process.env.NEXT_PUBLIC_BASE_URL}/tournaments/${tAlias}/${sAlias}/${rAlias}/${mdAlias}`}
        />
      </Head>

      {/* Breadcrumb Navigation */}
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <Link href="/" className="hover:text-gray-700">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/tournaments" className="hover:text-gray-700">
              Wettbewerbe
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href={`/tournaments/${tAlias}`} className="hover:text-gray-700">
              {tournamentName}
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href={`/tournaments/${tAlias}/${sAlias}`} className="hover:text-gray-700">
              {seasonName}
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href={`/tournaments/${tAlias}/${sAlias}/${rAlias}`} className="hover:text-gray-700">
              {roundName}
            </Link>
          </li>
          <li>/</li>
          <li className="font-medium text-gray-900" aria-current="page">
            {matchday.name}
          </li>
        </ol>
      </nav>

      {/* Matchday Header */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {matchday.name}
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          {roundName} · {seasonName} · {tournamentName}
        </p>

        {/* Matchday Type */}
        {matchday.type && (
          <p className="mt-2 text-sm text-gray-500">
            {matchday.type.value}
          </p>
        )}
        
        {/* Matchday Dates */}
        {(matchday.startDate || matchday.endDate) && (
          <p className="mt-2 text-sm text-gray-500">
            {matchday.startDate && new Date(matchday.startDate).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
            {matchday.startDate && matchday.endDate && ' - '}
            {matchday.endDate && new Date(matchday.endDate).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </p>
        )}

        {/* Owner (for tournament-style matchdays) */}
        {matchday.owner && (
          <p className="mt-2 text-sm text-gray-600">
            Austragungsort: {matchday.owner.clubName}
          </p>
        )}

        {matchday.published && (
          <span className="mt-3 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
            <CheckIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Veröffentlicht
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-8">
        <div className="sm:hidden">
          <label htmlFor="tabs" className="sr-only">
            Wähle einen Tab
          </label>
          <select
            id="tabs"
            name="tabs"
            className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as TabKey)}
          >
            {tabs.map((tab) => (
              <option key={tab.key} value={tab.key}>
                {tab.caption}
              </option>
            ))}
          </select>
        </div>
        <div className="hidden sm:block">
          <nav className="flex space-x-4 border-b border-gray-200" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={classNames(
                  tab.key === activeTab
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                  'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium'
                )}
                aria-current={tab.key === activeTab ? 'page' : undefined}
              >
                {tab.caption}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <section>
            {sortedMatches.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Keine Spiele verfügbar</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(matchesByDate).map(([date, matches]) => (
                  <div key={date}>
                    {/* Date Header (only if multiple dates) */}
                    {Object.keys(matchesByDate).length > 1 && (
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        {date}
                      </h2>
                    )}
                    
                    {/* Match Cards */}
                    <div className="space-y-4">
                      {matches.map((match) => (
                        <MatchCard
                          key={match._id || match.matchId}
                          match={match}
                          onMatchUpdated={() => {
                            // Optional: Add refetch logic here if needed
                          }}
                          from={`/tournaments/${tAlias}/${sAlias}/${rAlias}/${mdAlias}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Standings Tab */}
        {activeTab === 'standings' && (
          <section>
            {matchday.createStandings && standings && standings.length > 0 ? (
              <Standings standings={standings} />
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">
                  Keine Tabelle verfügbar
                </p>
              </div>
            )}
          </section>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <section>
            {matchday.createStats && stats ? (
              <div className="space-y-8">
                {/* Top Scorers */}
                {stats.topScorers && stats.topScorers.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Torschützen
                    </h2>
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rang
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Spieler
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Team
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tore
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {stats.topScorers.map((scorer: any, index: number) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {index + 1}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {scorer.playerName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {scorer.teamName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {scorer.goals}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Penalty Leaders */}
                {stats.penaltyLeaders && stats.penaltyLeaders.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Strafminuten
                    </h2>
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rang
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Spieler
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Team
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              PIM
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {stats.penaltyLeaders.map((leader: any, index: number) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {index + 1}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {leader.playerName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {leader.teamName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {leader.penaltyMinutes}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* No Stats Available */}
                {(!stats.topScorers || stats.topScorers.length === 0) && 
                 (!stats.penaltyLeaders || stats.penaltyLeaders.length === 0) && (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">
                      Keine Statistiken verfügbar
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">
                  Keine Statistiken verfügbar
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </Layout>
  );
}

export async function getStaticProps(context: GetStaticPropsContext) {
  const tAlias = context.params?.tAlias;
  const sAlias = context.params?.sAlias;
  const rAlias = context.params?.rAlias;
  const mdAlias = context.params?.mdAlias;

  if (typeof tAlias !== 'string' || typeof sAlias !== 'string' || typeof rAlias !== 'string' || typeof mdAlias !== 'string') {
    return { notFound: true };
  }

  try {
    // Fetch matchday data using apiClient
    const matchdayResponse = await apiClient.get(`/tournaments/${tAlias}/seasons/${sAlias}/rounds/${rAlias}/matchdays/${mdAlias}`);
    const matchdayData = matchdayResponse.data;

    // Fetch round data for breadcrumb using apiClient
    let roundName = rAlias;
    try {
      const roundResponse = await apiClient.get(`/tournaments/${tAlias}/seasons/${sAlias}/rounds/${rAlias}`);
      roundName = roundResponse.data?.name || rAlias;
    } catch (error) {
      console.error('Error fetching round:', error);
    }

    // Fetch season data for breadcrumb using apiClient
    let seasonName = sAlias;
    try {
      const seasonResponse = await apiClient.get(`/tournaments/${tAlias}/seasons/${sAlias}`);
      seasonName = seasonResponse.data?.name || sAlias;
    } catch (error) {
      console.error('Error fetching season:', error);
    }

    // Fetch tournament data for breadcrumb using apiClient
    let tournamentName = tAlias;
    try {
      const tournamentResponse = await apiClient.get(`/tournaments/${tAlias}`);
      tournamentName = tournamentResponse.data?.name || tAlias;
    } catch (error) {
      console.error('Error fetching tournament:', error);
    }

    // Fetch standings if applicable using apiClient
    let standings = null;
    if (matchdayData.createStandings) {
      try {
        const standingsResponse = await apiClient.get(`/tournaments/${tAlias}/seasons/${sAlias}/rounds/${rAlias}/matchdays/${mdAlias}/standings`);
        standings = standingsResponse.data;
      } catch (error) {
        console.error('Error fetching standings:', error);
        // Continue without standings
      }
    }

    // Fetch stats if applicable using apiClient
    let stats = null;
    if (matchdayData.createStats) {
      try {
        const statsResponse = await apiClient.get(`/tournaments/${tAlias}/seasons/${sAlias}/rounds/${rAlias}/matchdays/${mdAlias}/stats`);
        stats = statsResponse.data;
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Continue without stats
      }
    }

    return {
      props: {
        matchday: matchdayData,
        tAlias,
        sAlias,
        rAlias,
        mdAlias,
        tournamentName,
        seasonName,
        roundName,
        standings,
        stats,
      },
      revalidate: 60, // 1 minute for live matches
    };
  } catch (error) {
    console.error('Failed to fetch matchday data:', error);
    return { notFound: true };
  }
}

export async function getStaticPaths() {
  try {
    const tournamentsResponse = await apiClient.get('/tournaments');
    const tournaments = tournamentsResponse.data || [];
    
    let paths: { params: { tAlias: string; sAlias: string; rAlias: string; mdAlias: string } }[] = [];

    for (const tournament of tournaments) {
      try {
        const seasonsResponse = await apiClient.get(`/tournaments/${tournament.alias}/seasons`);
        const seasons = seasonsResponse.data || [];

        for (const season of seasons) {
          try {
            const roundsResponse = await apiClient.get(`/tournaments/${tournament.alias}/seasons/${season.alias}/rounds`);
            const rounds = roundsResponse.data || [];

            for (const round of rounds) {
              try {
                const matchdaysResponse = await apiClient.get(`/tournaments/${tournament.alias}/seasons/${season.alias}/rounds/${round.alias}/matchdays`);
                const matchdays = matchdaysResponse.data || [];

                const matchdayPaths = matchdays.map((matchday: any) => ({
                  params: { 
                    tAlias: tournament.alias, 
                    sAlias: season.alias,
                    rAlias: round.alias,
                    mdAlias: matchday.alias
                  },
                }));
                
                paths = paths.concat(matchdayPaths);
              } catch (error) {
                console.error(`Error fetching matchdays for ${tournament.alias}/${season.alias}/${round.alias}:`, error);
                // Continue with other rounds
              }
            }
          } catch (error) {
            console.error(`Error fetching rounds for ${tournament.alias}/${season.alias}:`, error);
            // Continue with other seasons
          }
        }
      } catch (error) {
        console.error(`Error fetching seasons for ${tournament.alias}:`, error);
        // Continue with other tournaments
      }
    }

    return {
      paths,
      fallback: 'blocking',
    };
  } catch (error) {
    console.error('Failed to generate static paths:', error);
    return {
      paths: [],
      fallback: 'blocking',
    };
  }
}
