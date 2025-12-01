
import { GetStaticPropsContext } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import { CheckIcon } from '@heroicons/react/20/solid';
import Layout from '../../../../../components/Layout';
import { RoundValues, MatchdayValues } from '../../../../../types/TournamentValues';
import Standings from '../../../../../components/ui/Standings';
import apiClient from '../../../../../lib/apiClient';

interface RoundOverviewProps {
  round: RoundValues;
  matchdays: MatchdayValues[];
  tAlias: string;
  sAlias: string;
  rAlias: string;
  tournamentName: string;
  seasonName: string;
}

export default function RoundOverview({
  round,
  matchdays,
  tAlias,
  sAlias,
  rAlias,
  tournamentName,
  seasonName,
}: RoundOverviewProps) {
  // Sort matchdays by alias
  const sortedMatchdays = matchdays
    .slice()
    .sort((a, b) => a.alias.localeCompare(b.alias));

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

      {/* Standings Section */}
      {round.createStandings && round.standings.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Tabelle</h2>
          <Standings standingsData={standings} />
        </section>
      )}

      {/* Matchdays Section */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Spieltage</h2>
        
        {sortedMatchdays.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Keine Spieltage verfügbar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedMatchdays.map((matchday) => (
              <Link
                key={matchday.alias}
                href={`/tournaments/${tAlias}/${sAlias}/${rAlias}/${matchday.alias}`}
                className="relative flex flex-col space-y-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="focus:outline-none">
                    <span className="absolute inset-0" aria-hidden="true" />
                    
                    {/* Matchday Name */}
                    <p className="text-lg font-medium text-gray-900">
                      {matchday.name}
                    </p>
                    
                    {/* Matchday Type */}
                    {matchday.type && (
                      <p className="mt-1 text-sm text-gray-500">
                        {matchday.type.value}
                      </p>
                    )}
                    
                    {/* Matchday Dates */}
                    {(matchday.startDate || matchday.endDate) && (
                      <p className="mt-2 text-sm text-gray-600">
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
                      <p className="mt-2 text-sm text-gray-500">
                        Veranstalter: {matchday.owner.clubName}
                      </p>
                    )}
                    
                    {/* Match Count */}
                    <p className="mt-2 text-sm text-gray-500">
                      {matchday.matches?.length || 0} {matchday.matches?.length === 1 ? 'Spiel' : 'Spiele'}
                    </p>
                    
                    {/* Published Status */}
                    <div className="mt-3 flex items-center">
                      {matchday.published ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          <CheckIcon className="mr-1 h-3 w-3" aria-hidden="true" />
                          Veröffentlicht
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                          Entwurf
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
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
      // Continue with empty matchdays array
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
