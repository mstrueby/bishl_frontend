
import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import apiClient from '../../../lib/apiClient';
import { TournamentValues, SeasonValues, RoundValues, MatchdayValues } from '../../../types/TournamentValues';
import { MatchValues } from '../../../types/MatchValues';
import MatchCard from '../../../components/ui/MatchCard';

interface TournamentOverviewProps {
  tournament: TournamentValues;
  currentSeason: SeasonValues;
  allSeasons: SeasonValues[];
  allRounds: RoundValues[];
  liveAndUpcomingMatches: MatchValues[];
}

export default function TournamentOverview({
  tournament,
  currentSeason,
  allSeasons,
  allRounds,
  liveAndUpcomingMatches
}: TournamentOverviewProps) {
  const router = useRouter();
  const [selectedRound, setSelectedRound] = useState<string>('');

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`/tournaments/${tournament.alias}/${e.target.value}`);
  };

  const handleRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRound = e.target.value;
    if (newRound) {
      router.push(`/tournaments/${tournament.alias}/${currentSeason.alias}/${newRound}`);
    }
    setSelectedRound(newRound);
  };

  return (
    <Layout>
      <Head>
        <title>{tournament.name} | BISHL</title>
        <meta 
          name="description" 
          content={`${tournament.name} - Aktuelle Saison ${currentSeason.name}. Spielplan, Ergebnisse und Tabelle.`} 
        />
        <link 
          rel="canonical" 
          href={`${process.env.NEXT_PUBLIC_BASE_URL}/tournaments/${tournament.alias}/${currentSeason.alias}`} 
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
          <li aria-current="page">
            <div className="flex items-center">
              <svg className="w-3 h-3 text-gray-400 mx-1" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
              </svg>
              <span className="ml-1 text-sm font-medium text-gray-500">{tournament.name}</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header with Season Selector */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {tournament.name}
          </h1>
          <p className="mt-2 text-lg text-gray-600">Saison {currentSeason.name}</p>
        </div>
        
        {allSeasons.length > 1 && (
          <div className="mt-4 sm:mt-0">
            <select
              value={currentSeason.alias}
              onChange={handleSeasonChange}
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              {allSeasons.map((s) => (
                <option key={s.alias} value={s.alias}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* All Rounds Overview */}
      <div>
        {/**<h2 className="text-2xl font-semibold text-gray-900 mb-6">Runden - Saison {currentSeason.name}</h2> */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allRounds.map((round) => (
            <Link
              key={round.alias}
              href={`/tournaments/${tournament.alias}/${currentSeason.alias}/${round.alias}`}
              className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all"
            >
              <div className="flex-1 min-w-0">
                <p className="text-lg font-medium text-gray-900">{round.name}</p>
                {round.startDate && (
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(round.startDate).toLocaleDateString('de-DE')}
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

      {/* Live & Upcoming Matches */}
      {liveAndUpcomingMatches.length > 0 && (
        <div className="mt-14 mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Aktuelle & kommende Spiele</h2>
          
          {(() => {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const pastMatches = liveAndUpcomingMatches.filter((match) => {
              const matchDate = new Date(match.startDate);
              const matchDay = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
              return matchDay < today;
            });
            
            const todayMatches = liveAndUpcomingMatches.filter((match) => {
              const matchDate = new Date(match.startDate);
              const matchDay = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
              return matchDay.getTime() === today.getTime();
            });
            
            const nextMatches = liveAndUpcomingMatches.filter((match) => {
              const matchDate = new Date(match.startDate);
              const matchDay = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
              return matchDay >= tomorrow;
            });
            
            const tabs = [
              { key: 'past', label: 'Vergangene', matches: pastMatches },
              { key: 'today', label: 'Heute', matches: todayMatches },
              { key: 'next', label: 'Kommende', matches: nextMatches }
            ].filter(tab => tab.matches.length > 0);
            
            const [activeTab, setActiveTab] = useState(tabs[0]?.key || 'today');
            const activeMatches = tabs.find(tab => tab.key === activeTab)?.matches || [];
            
            return (
              <>
                {tabs.length > 1 && (
                  <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                      {tabs.map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={`
                            ${activeTab === tab.key
                              ? 'border-indigo-500 text-indigo-600'
                              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            }
                            whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                          `}
                        >
                          {tab.label} ({tab.matches.length})
                        </button>
                      ))}
                    </nav>
                  </div>
                )}
                
                <div className="space-y-4">
                  {activeMatches.map((match) => (
                    <MatchCard
                      key={match._id || match.matchId}
                      match={match}
                      from={`/tournaments/${tournament.alias}`}
                    />
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Quick Round Navigation */}
      {/**
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
        <label htmlFor="quick-round-select" className="block text-sm font-medium text-gray-700 mb-2">
          Schnellnavigation zu einer Runde
        </label>
        <select
          id="quick-round-select"
          value={selectedRound}
          onChange={handleRoundChange}
          className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Runde wählen...</option>
          {allRounds.map((round) => (
            <option key={round.alias} value={round.alias}>
              {round.name}
            </option>
          ))}
        </select>
      </div>
      */}


    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const response = await apiClient.get('/tournaments');
    const tournaments = response.data || [];
    const paths = tournaments.map((t: TournamentValues) => ({
      params: { tAlias: t.alias },
    }));
    return { paths, fallback: 'blocking' };
  } catch (error) {
    console.error('Error fetching tournaments for paths:', error);
    return { paths: [], fallback: 'blocking' };
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const tAlias = params?.tAlias as string;

  if (!tAlias) {
    return { notFound: true };
  }

  try {
    const [tournamentResponse, seasonsResponse] = await Promise.all([
      apiClient.get(`/tournaments/${tAlias}`),
      apiClient.get(`/tournaments/${tAlias}/seasons`)
    ]);

    const tournament = tournamentResponse.data;
    const allSeasons = seasonsResponse.data || [];

    // Find current season (most recent published)
    const publishedSeasons = allSeasons
      .filter((s: SeasonValues) => s.published)
      .sort((a: SeasonValues, b: SeasonValues) => b.alias.localeCompare(a.alias));

    if (publishedSeasons.length === 0) {
      return { notFound: true };
    }

    const currentSeason = publishedSeasons[0];

    // Fetch rounds for current season
    const roundsResponse = await apiClient.get(
      `/tournaments/${tAlias}/seasons/${currentSeason.alias}/rounds`
    );
    const allRounds = roundsResponse.data || [];

    // Fetch live and upcoming matches
    let liveAndUpcomingMatches: MatchValues[] = [];
    try {
      const matchesResponse = await apiClient.get(
        `/matches?tournament=${tAlias}&season=${currentSeason.alias}&status=live,upcoming&limit=10`
      );
      liveAndUpcomingMatches = matchesResponse.data || [];
    } catch (error) {
      console.error('Error fetching live/upcoming matches:', error);
    }

    return {
      props: {
        tournament,
        currentSeason,
        allSeasons: publishedSeasons,
        allRounds: allRounds
          .filter((r: RoundValues) => r.published)
          .sort((a: RoundValues, b: RoundValues) => {
            if (a.startDate && b.startDate) {
              return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
            }
            return a.alias.localeCompare(b.alias);
          }),
        liveAndUpcomingMatches,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return { notFound: true };
  }
};
