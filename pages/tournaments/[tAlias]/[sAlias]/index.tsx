
import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
import Layout from '../../../../components/Layout';
import { tournamentConfigs } from '../../../../tools/consts';
import apiClient from '../../../../lib/apiClient';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Round {
  _id: string;
  name: string;
  alias: string;
  sortOrder: number;
  published: boolean;
  startDate?: Date;
  endDate?: Date;
  createStandings: boolean;
  createStats: boolean;
}

interface Season {
  _id: string;
  name: string;
  alias: string;
  published: boolean;
  rounds: Round[];
}

interface Tournament {
  _id: string;
  name: string;
  alias: string;
  tinyName: string;
  published: boolean;
}

interface SeasonOverviewProps {
  tournament: Tournament;
  season: Season;
  rounds: Round[];
}

export default function SeasonOverview({ tournament, season, rounds }: SeasonOverviewProps) {
  const sortedRounds = rounds
    .filter(r => r.published)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const config = tournamentConfigs[tournament.alias];

  const formatDateRange = (startDate?: Date, endDate?: Date) => {
    if (!startDate || !endDate) return '';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return `${format(start, 'd. LLL', { locale: de })} - ${format(end, 'd. LLL yyyy', { locale: de })}`;
  };

  return (
    <Layout>
      <Head>
        <title>{tournament.name} - {season.name} - BISHL</title>
        <meta name="description" content={`${tournament.name} ${season.name} - Übersicht aller Runden`} />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/" className="text-gray-700 hover:text-gray-900 hover:no-underline">
                Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <Link href={`/tournaments/${tournament.alias}`} className="text-gray-700 hover:text-gray-900 hover:no-underline">
                  {tournament.name}
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-gray-500">{season.name}</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Season Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {tournament.name} - {season.name}
            </h1>
            {config && (
              <span className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-medium ring-1 ring-inset ${config.bdgColLight}`}>
                {config.tinyName}
              </span>
            )}
          </div>
          <p className="text-lg text-gray-600">Wählen Sie eine Runde</p>
        </div>

        {/* Rounds List */}
        <div className="space-y-4">
          {sortedRounds.map((round) => (
            <Link
              key={round._id}
              href={`/tournaments/${tournament.alias}/${season.alias}/${round.alias}`}
              className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-50 hover:shadow-md transition-all hover:no-underline"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {round.name}
                  </h2>
                  {round.startDate && round.endDate && (
                    <p className="text-sm text-gray-500">
                      {formatDateRange(round.startDate, round.endDate)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {round.createStandings && (
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      Tabelle
                    </span>
                  )}
                  {round.createStats && (
                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      Statistik
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {sortedRounds.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Keine Runden verfügbar</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const tournamentsResponse = await apiClient.get('/tournaments');
    const tournaments = tournamentsResponse.data;
    
    const paths = [];
    
    for (const tournament of tournaments) {
      if (!tournament.published) continue;
      
      const seasonsResponse = await apiClient.get(`/tournaments/${tournament.alias}/seasons`);
      const seasons = seasonsResponse;
      
      for (const season of seasons) {
        if (!season.published) continue;
        
        paths.push({
          params: {
            tAlias: tournament.alias,
            sAlias: season.alias,
          },
        });
      }
    }
    
    return { paths, fallback: 'blocking' };
  } catch (error) {
    console.error('Error in getStaticPaths:', error);
    return { paths: [], fallback: 'blocking' };
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { tAlias, sAlias } = params!;

  try {
    const [tournamentResponse, seasonResponse, roundsResponse] = await Promise.all([
      apiClient.get(`/tournaments/${tAlias}`),
      apiClient.get(`/tournaments/${tAlias}/seasons/${sAlias}`),
      apiClient.get(`/tournaments/${tAlias}/seasons/${sAlias}/rounds`),
    ]);

    const tournament = tournamentResponse;
    const season = seasonResponse;
    const rounds = roundsResponse;

    if (!tournament?.published || !season?.published) {
      return { notFound: true };
    }

    return {
      props: {
        tournament: {
          _id: tournament._id,
          name: tournament.name,
          alias: tournament.alias,
          tinyName: tournament.tinyName,
          published: tournament.published,
        },
        season,
        rounds,
      },
      revalidate: 300, // ISR: 5 minutes
    };
  } catch (error) {
    console.error('Error fetching season data:', error);
    return { notFound: true };
  }
};
