
import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import { Fragment } from 'react';
import Layout from '../../../components/Layout';
import { tournamentConfigs } from '../../../tools/consts';
import apiClient from '../../../lib/apiClient';
import Link from 'next/link';
import { CheckIcon } from '@heroicons/react/20/solid';

interface Season {
  name: string;
  alias: string;
  published: boolean;
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

export default function TournamentOverview({
  tournament
}: {
  tournament: Tournament
}) {
  const sortedSeasons = tournament.seasons
    .slice()
    .sort((a, b) => b.name.localeCompare(a.name));

  return (
    <Layout>
      <Head>
        <title>{tournament.name} | BISHL</title>
        <meta name="description" content={`${tournament.name} - ${tournament.ageGroup} - Übersicht aller Saisons`} />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_BASE_URL}/tournaments/${tournament.alias}`} />
      </Head>

      {/* Breadcrumb Navigation */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600">
              Home
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
              </svg>
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Wettbewerbe</span>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
              </svg>
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">{tournament.name}</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Tournament Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-medium uppercase leading-7 text-gray-900 sm:truncate sm:text-3xl tracking-wider">
            {tournament.name}
          </h2>
          {tournament.ageGroup && (
            <p className="mt-1 text-sm text-gray-500">
              Altersklasse: {tournament.ageGroup}
            </p>
          )}
        </div>

        {/* Tournament Badge */}
        <div className="mt-4 sm:mt-0">
          {(() => {
            const item = tournamentConfigs[tournament.alias];
            if (item) {
              return (
                <span
                  className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium uppercase ring-1 ring-inset ${item.bdgColLight}`}
                >
                  {item.tinyName}
                </span>
              );
            }
          })()}
        </div>
      </div>

      {/* Seasons Section */}
      <section className="mt-10">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Saisons</h3>
        
        {sortedSeasons.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Keine Saisons verfügbar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedSeasons.map((season) => (
              <Link
                key={season.alias}
                href={`/tournaments/${tournament.alias}/${season.alias}`}
                className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="focus:outline-none">
                    <span className="absolute inset-0" aria-hidden="true" />
                    <p className="text-lg font-medium text-gray-900">
                      {typeof season.name === 'object' && season.name !== null && 'value' in season.name 
                        ? season.name.value 
                        : season.name}
                    </p>
                    <div className="mt-2 flex items-center">
                      {season.published ? (
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
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* External Website Link */}
      {tournament.external && tournament.website && (
        <div className="mt-8 border-t border-gray-200 pt-8">
          <a
            href={tournament.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Externe Website besuchen
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const response = await apiClient.get('/tournaments');
    const allTournamentsData = response.data;
    const paths = allTournamentsData.map((tournament: Tournament) => ({
      params: { tAlias: tournament.alias },
    }));
    return { paths, fallback: 'blocking' };
  } catch (error) {
    console.error('Error fetching tournaments for paths:', error);
    return { paths: [], fallback: 'blocking' };
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const tAlias = params?.tAlias;

  if (!tAlias || typeof tAlias !== 'string') {
    return { notFound: true };
  }

  try {
    const response = await apiClient.get(`/tournaments/${tAlias}`);
    const tournament = response.data || response;

    if (!tournament) {
      return { notFound: true };
    }

    return {
      props: {
        tournament,
      },
      revalidate: 300, // 5 minutes ISR
    };
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return { notFound: true };
  }
};
