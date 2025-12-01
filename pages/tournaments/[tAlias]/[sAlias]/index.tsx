import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Layout from '../../../../components/Layout';
import apiClient from '../../../../lib/apiClient';
import { SeasonValues, RoundValues } from '../../../../types/TournamentValues';

interface SeasonOverviewProps {
  season: SeasonValues;
  tAlias: string;
  sAlias: string;
  tournamentName: string;
  latestRoundAlias: string | null;
}

export default function SeasonOverview({
  season,
  tAlias,
  latestRoundAlias,
  tournamentName
}: SeasonOverviewProps) {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to latest round
    if (latestRoundAlias) {
      router.replace(`/tournaments/${tAlias}/${season.alias}/${latestRoundAlias}`);
    }
  }, [latestRoundAlias, tAlias, season.alias, router]);

  return (
    <Layout>
      <Head>
        <title>{season.name} - {tournamentName} | BISHL</title>
        <meta name="description" content={`Übersicht über die Saison ${season.name} im ${tournamentName}`} />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_BASE_URL}/tournaments/${tAlias}/${season.alias}`} />
      </Head>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade aktuelle Runde...</p>
        </div>
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
      try {
        const seasonsResponse = await apiClient.get(`/tournaments/${tournament.alias}/seasons`);
        const seasons = seasonsResponse.data || [];
        for (const season of seasons) {
          paths.push({
            params: {
              tAlias: tournament.alias,
              sAlias: season.alias,
            },
          });
        }
      } catch (error) {
        console.error(`Error fetching seasons for ${tournament.alias}:`, error);
      }
    }

    return { paths, fallback: 'blocking' };
  } catch (error) {
    console.error('Error in getStaticPaths:', error);
    return { paths: [], fallback: 'blocking' };
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const tAlias = params?.tAlias;
  const sAlias = params?.sAlias;

  if (typeof tAlias !== 'string' || typeof sAlias !== 'string') {
    return { notFound: true };
  }

  try {
    const seasonResponse = await apiClient.get(`/tournaments/${tAlias}/seasons/${sAlias}`);
    const seasonData = seasonResponse.data;

    // Fetch rounds to find latest one
    let rounds: RoundValues[] = [];
    let latestRoundAlias: string | null = null;

    try {
      const roundsResponse = await apiClient.get(`/tournaments/${tAlias}/seasons/${sAlias}/rounds`);
      rounds = roundsResponse.data || [];

      // Find latest published round
      const publishedRounds = rounds
        .filter(r => r.published)
        .sort((a, b) => b.alias.localeCompare(a.alias));

      if (publishedRounds.length > 0) {
        latestRoundAlias = publishedRounds[0].alias;
      }
    } catch (error) {
      console.error('Error fetching rounds:', error);
    }

    let tournamentName = tAlias;
    try {
      const tournamentResponse = await apiClient.get(`/tournaments/${tAlias}`);
      tournamentName = tournamentResponse.data?.name || tAlias;
    } catch (error) {
      console.error('Error fetching tournament:', error);
    }

    return {
      props: {
        season: seasonData,
        tAlias,
        sAlias,
        tournamentName,
        latestRoundAlias,
      },
      revalidate: 300,
    };
  } catch (error) {
    console.error('Failed to fetch season data:', error);
    return { notFound: true };
  }
};