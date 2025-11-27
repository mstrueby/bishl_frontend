
import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { Fragment } from 'react';
import { tournamentConfigs } from '../../../tools/consts';
import apiClient from '../../../lib/apiClient';

interface Season {
  _id: string;
  name: string;
  alias: string;
  published: boolean;
  startDate?: Date;
  endDate?: Date;
}

interface Tournament {
  _id: string;
  name: string;
  alias: string;
  tinyName: string;
  ageGroup: string;
  published: boolean;
  active: boolean;
  external: boolean;
  website: string;
  seasons: Season[];
}

interface TournamentOverviewProps {
  tournament: Tournament;
}

export default function TournamentOverview({ tournament }: TournamentOverviewProps) {
  const sortedSeasons = tournament.seasons
    .filter(s => s.published)
    .sort((a, b) => b.name.localeCompare(a.name));

  const config = tournamentConfigs[tournament.alias];

  return (
    <Layout>
      <Head>
        <title>{tournament.name} - BISHL</title>
        <meta name="description" content={`${tournament.name} - Übersicht aller Saisons`} />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/" className="text-gray-700 hover:text-gray-900">
                Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-gray-500">{tournament.name}</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Tournament Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{tournament.name}</h1>
            {config && (
              <span className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-medium ring-1 ring-inset ${config.bdgColLight}`}>
                {config.tinyName}
              </span>
            )}
          </div>
          <p className="text-lg text-gray-600">Wählen Sie eine Saison</p>
        </div>

        {/* Seasons List */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedSeasons.map((season) => (
            <Link
              key={season._id}
              href={`/tournaments/${tournament.alias}/${season.alias}`}
              className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-50 hover:shadow-md transition-all hover:no-underline"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {season.name}
              </h2>
              {season.startDate && season.endDate && (
                <p className="text-sm text-gray-500">
                  {new Date(season.startDate).toLocaleDateString('de-DE')} - {new Date(season.endDate).toLocaleDateString('de-DE')}
                </p>
              )}
            </Link>
          ))}
        </div>

        {sortedSeasons.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Keine Saisons verfügbar</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const response = await apiClient.get('/tournaments');
    const tournaments = response.data;
    
    const paths = tournaments
      .filter((t: Tournament) => t.published)
      .map((tournament: Tournament) => ({
        params: { tAlias: tournament.alias },
      }));
    
    return { paths, fallback: 'blocking' };
  } catch (error) {
    console.error('Error in getStaticPaths:', error);
    return { paths: [], fallback: 'blocking' };
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { tAlias } = params!;

  try {
    const response = await apiClient.get(`/tournaments/${tAlias}`);
    const tournament = response;

    if (!tournament || !tournament.published) {
      return { notFound: true };
    }

    return {
      props: { tournament },
      revalidate: 300, // ISR: 5 minutes
    };
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return { notFound: true };
  }
};
