import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import apiClient from '../../../lib/apiClient';
import { TournamentValues, SeasonValues } from '../../../types/TournamentValues';

interface TournamentOverviewProps {
  tournament: TournamentValues;
  seasons: SeasonValues[];
  currentSeasonAlias: string | null;
}

export default function TournamentOverview({
  tournament,
  currentSeasonAlias
}: TournamentOverviewProps) {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to current season
    if (currentSeasonAlias) {
      router.replace(`/tournaments/${tournament.alias}/${currentSeasonAlias}`);
    }
  }, [currentSeasonAlias, tournament.alias, router]);

  return (
    <Layout>
      <Head>
        <title>{tournament.name} | BISHL</title>
        <meta name="description" content={`${tournament.name} - ${tournament.ageGroup?.value || ''}`} />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_BASE_URL}/tournaments/${tournament.alias}`} />
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

      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade aktuelle Saison...</p>
        </div>
      </div>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const response = await apiClient.get('/tournaments');
    const allTournamentsData = response.data;
    const paths = allTournamentsData.map((tournament: TournamentValues) => ({
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
    const tournamentResponse = await apiClient.get(`/tournaments/${tAlias}`);
    const tournament = tournamentResponse.data;

    if (!tournament) {
      return { notFound: true };
    }

    // Fetch seasons to find current one
    let seasons: SeasonValues[] = [];
    let currentSeasonAlias: string | null = null;

    try {
      const seasonsResponse = await apiClient.get(`/tournaments/${tAlias}/seasons`);
      seasons = seasonsResponse.data || [];

      // Find current season (most recent published season)
      const publishedSeasons = seasons
        .filter(s => s.published)
        .sort((a, b) => b.alias.localeCompare(a.alias));

      if (publishedSeasons.length > 0) {
        currentSeasonAlias = publishedSeasons[0].alias;
      }
    } catch (error) {
      console.error('Error fetching seasons:', error);
    }

    return {
      props: {
        tournament,
        seasons,
        currentSeasonAlias,
      },
      revalidate: 300,
    };
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return { notFound: true };
  }
};