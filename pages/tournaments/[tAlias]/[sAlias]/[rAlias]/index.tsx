
import { GetStaticPropsContext } from 'next';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CheckIcon } from '@heroicons/react/20/solid';
import Layout from '../../../../../components/Layout';
import { RoundValues, MatchdayValues } from '../../../../../types/TournamentValues';
import { MatchValues } from '../../../../../types/MatchValues';
import Standings from '../../../../../components/ui/Standings';
import MatchCard from '../../../../../components/ui/MatchCard';
import TeamSelect from '../../../../../components/ui/TeamSelect';
import apiClient from '../../../../../lib/apiClient';

interface RoundOverviewProps {
  round: RoundValues;
  matchdays: MatchdayValues[];
  initialMatches: MatchValues[];
  currentMatchdayAlias: string | null;
  tAlias: string;
  sAlias: string;
  rAlias: string;
  tournamentName: string;
  seasonName: string;
}

type TabKey = 'matches' | 'standings';

export default function RoundOverview({
  round,
  matchdays,
  initialMatches,
  currentMatchdayAlias,
  tAlias,
  sAlias,
  rAlias,
  tournamentName,
  seasonName,
}: RoundOverviewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('matches');
  const [selectedMatchdayAlias, setSelectedMatchdayAlias] = useState<string | null>(currentMatchdayAlias);
  const [matches, setMatches] = useState<MatchValues[]>(initialMatches);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  
  // Sort matchdays by alias (most recent first)
  const sortedMatchdays = matchdays
    .slice()
    .sort((a, b) => b.alias.localeCompare(a.alias));

  // Fetch matches when matchday changes
  useEffect(() => {
    if (!selectedMatchdayAlias) return;
    
    const fetchMatches = async () => {
      setIsLoadingMatches(true);
      try {
        const response = await apiClient.get(
          `/matches?tournament=${tAlias}&season=${sAlias}&round=${rAlias}&matchday=${selectedMatchdayAlias}`
        );
        setMatches(response.data || []);
      } catch (error) {
        console.error('Error fetching matches:', error);
        setMatches([]);
      } finally {
        setIsLoadingMatches(false);
      }
    };

    fetchMatches();
  }, [selectedMatchdayAlias, tAlias, sAlias, rAlias]);

  // Filter matches by team
  const filteredMatches = matches.filter(match => {
    if (selectedTeam === 'all') return true;
    return match.home.fullName === selectedTeam || match.away.fullName === selectedTeam;
  });

  // Sort and group matches by date
  const sortedMatches = filteredMatches
    .slice()
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const matchesByDate = sortedMatches.reduce((acc, match) => {
    const dateKey = new Date(match.startTime).toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(match);
    return acc;
  }, {} as Record<string, typeof sortedMatches>);

  // Determine if tabs are needed
  const showTabs = round.createStandings && round.standings;
  
  // Tabs configuration
  const tabs = showTabs
    ? [
        { key: 'matches' as TabKey, caption: 'Spiele' },
        { key: 'standings' as TabKey, caption: 'Tabelle' },
      ]
    : [];

  return (
    <Layout>
      <Head>
        <title>{round.name} - {seasonName} - {tournamentName} | BISHL</title>
        <meta
          name="description"
          content={`${round.name} der Saison ${seasonName} im ${tournamentName}. Spieltage, Tabelle und Statistiken.`}
        />
        <link
          rel="canonical"
          href={`${process.env.NEXT_PUBLIC_BASE_URL}/tournaments/${tAlias}/${sAlias}/${rAlias}`}
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
          <li className="font-medium text-gray-900" aria-current="page">
            {round.name}
          </li>
        </ol>
      </nav>

      {/* Round Header */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {round.name}
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          {seasonName} · {tournamentName}
        </p>
        
        {/* Round Dates */}
        {(round.startDate || round.endDate) && (
          <p className="mt-2 text-sm text-gray-500">
            {round.startDate && new Date(round.startDate).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
            {round.startDate && round.endDate && ' - '}
            {round.endDate && new Date(round.endDate).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </p>
        )}

        {round.published && (
          <span className="mt-3 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
            <CheckIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Veröffentlicht
          </span>
        )}
      </div>

      {/* Matchday Navigation (only show if multiple matchdays) */}
      {sortedMatchdays.length > 1 && (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-gray-700">Spieltag:</label>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-2" aria-label="Spieltage">
            {sortedMatchdays.map((matchday) => (
              <button
                key={matchday.alias}
                onClick={() => setSelectedMatchdayAlias(matchday.alias)}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium border-2 transition-all whitespace-nowrap ${
                  selectedMatchdayAlias === matchday.alias
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                    : 'border-gray-300 text-gray-700 hover:border-indigo-400'
                }`}
              >
                {matchday.name}
              </button>
            ))}
          </nav>
        </section>
      )}

      {/* Tab Navigation (only if standings exist) */}
      {showTabs && (
        <div className="mt-8">
          <div className="sm:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as TabKey)}
              className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
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
                  className={`${
                    tab.key === activeTab
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                >
                  {tab.caption}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="mt-8">
        {/* Matches Tab (default) */}
        {(!showTabs || activeTab === 'matches') && (
          <section>
            {/* Team Filter */}
            <div className="mb-6 flex items-center gap-4">
              <label htmlFor="team-filter" className="text-sm font-medium text-gray-700">
                Team Filter:
              </label>
              <select
                id="team-filter"
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="all">Alle Teams</option>
                {Array.from(new Set(matches.flatMap(m => [m.home.fullName, m.away.fullName])))
                  .sort()
                  .map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
              </select>
            </div>

            {/* Matches List */}
            {isLoadingMatches ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Lade Spiele...</p>
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Keine Spiele verfügbar</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(matchesByDate).map(([date, matches]) => (
                  <div key={date}>
                    {Object.keys(matchesByDate).length > 1 && (
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {date}
                      </h3>
                    )}
                    <div className="space-y-4">
                      {matches.map((match) => (
                        <MatchCard
                          key={match._id || match.matchId}
                          match={match}
                          from={`/tournaments/${tAlias}/${sAlias}/${rAlias}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Link to full matchday view */}
            {selectedMatchdayAlias && (
              <div className="mt-6 text-center">
                <Link
                  href={`/tournaments/${tAlias}/${sAlias}/${rAlias}/${selectedMatchdayAlias}`}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Vollständige Spieltag-Ansicht →
                </Link>
              </div>
            )}
          </section>
        )}

        {/* Standings Tab */}
        {showTabs && activeTab === 'standings' && (
          <section>
            <Standings 
              standingsData={round.standings!} 
              matchSettings={round.matchSettings}
            />
            {/* Link to dedicated standings page */}
            <div className="mt-6 text-center">
              <Link
                href={`/tournaments/${tAlias}/${sAlias}/${rAlias}/standings`}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Tabelle teilen →
              </Link>
            </div>
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

  if (typeof tAlias !== 'string' || typeof sAlias !== 'string' || typeof rAlias !== 'string') {
    return { notFound: true };
  }

  try {
    // Fetch round data using apiClient
    const roundResponse = await apiClient.get(`/tournaments/${tAlias}/seasons/${sAlias}/rounds/${rAlias}`);
    const roundData = roundResponse.data;

    // Fetch matchdays separately using apiClient
    let matchdays: MatchdayValues[] = [];
    try {
      const matchdaysResponse = await apiClient.get(`/tournaments/${tAlias}/seasons/${sAlias}/rounds/${rAlias}/matchdays`);
      matchdays = matchdaysResponse.data || [];
    } catch (error) {
      console.error('Error fetching matchdays:', error);
    }

    // Determine current/most recent matchday
    const sortedMatchdays = matchdays
      .slice()
      .sort((a, b) => b.alias.localeCompare(a.alias));
    const currentMatchdayAlias = sortedMatchdays.length > 0 ? sortedMatchdays[0].alias : null;

    // Fetch initial matches for current matchday
    let initialMatches: MatchValues[] = [];
    if (currentMatchdayAlias) {
      try {
        const matchesResponse = await apiClient.get(
          `/matches?tournament=${tAlias}&season=${sAlias}&round=${rAlias}&matchday=${currentMatchdayAlias}`
        );
        initialMatches = matchesResponse.data || [];
      } catch (error) {
        console.error('Error fetching matches:', error);
      }
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

    return {
      props: {
        round: roundData,
        matchdays,
        initialMatches,
        currentMatchdayAlias,
        tAlias,
        sAlias,
        rAlias,
        tournamentName,
        seasonName
      },
      revalidate: 180, // 3 minutes
    };
  } catch (error) {
    console.error('Failed to fetch round data:', error);
    return { notFound: true };
  }
}

export async function getStaticPaths() {
  try {
    const tournamentsResponse = await apiClient.get('/tournaments');
    const tournaments = tournamentsResponse.data || [];
    
    let paths: { params: { tAlias: string; sAlias: string; rAlias: string } }[] = [];

    for (const tournament of tournaments) {
      try {
        const seasonsResponse = await apiClient.get(`/tournaments/${tournament.alias}/seasons`);
        const seasons = seasonsResponse.data || [];

        for (const season of seasons) {
          try {
            const roundsResponse = await apiClient.get(`/tournaments/${tournament.alias}/seasons/${season.alias}/rounds`);
            const rounds = roundsResponse.data || [];

            const seasonPaths = rounds.map((round: RoundValues) => ({
              params: { 
                tAlias: tournament.alias, 
                sAlias: season.alias,
                rAlias: round.alias 
              },
            }));
            
            paths = paths.concat(seasonPaths);
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
