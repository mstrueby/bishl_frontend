
import Head from 'next/head';
import { GetStaticProps } from 'next';
import Layout from '../../components/Layout';
import apiClient from '../../lib/apiClient';
import Link from 'next/link';
import { TournamentValues } from '../../types/TournamentValues';
import { tournamentConfigs } from '../../tools/consts';

interface TournamentsOverviewProps {
  tournaments: TournamentValues[];
}

export default function TournamentsOverview({ tournaments }: TournamentsOverviewProps) {
  const publishedTournaments = tournaments.filter(t => t.published);

  return (
    <Layout>
      <Head>
        <title>Wettbewerbe | BISHL</title>
        <meta name="description" content="Übersicht aller BISHL Wettbewerbe und Turniere" />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_BASE_URL}/tournaments`} />
      </Head>

      {/* Breadcrumb Navigation */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600">
              Home
            </Link>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
              </svg>
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Wettbewerbe</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-medium uppercase leading-7 text-gray-900 sm:text-4xl tracking-wider">
          Wettbewerbe
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Alle aktiven Turniere und Ligen der BISHL
        </p>
      </div>

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {publishedTournaments.map((tournament) => {
          const config = tournamentConfigs[tournament.alias];
          return (
            <Link
              key={tournament.alias}
              href={`/tournaments/${tournament.alias}`}
              className="relative flex flex-col rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all"
            >
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {tournament.name}
                    </h3>
                    {tournament.ageGroup && (
                      <p className="text-sm text-gray-500 mb-3">
                        {tournament.ageGroup.value}
                      </p>
                    )}
                  </div>
                  {config && (
                    <span
                      className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-medium uppercase ring-1 ring-inset ${config.bdgColLight} ml-2`}
                    >
                      {config.tinyName}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end mt-4">
                <span className="text-sm font-medium text-indigo-600">
                  Details ansehen
                </span>
                <svg className="ml-2 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>

      {publishedTournaments.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Keine Wettbewerbe verfügbar</p>
        </div>
      )}
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const response = await apiClient.get('/tournaments');
    const tournaments = response.data || [];

    return {
      props: {
        tournaments,
      },
      revalidate: 300, // 5 minutes ISR
    };
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return {
      props: {
        tournaments: [],
      },
      revalidate: 60,
    };
  }
};
