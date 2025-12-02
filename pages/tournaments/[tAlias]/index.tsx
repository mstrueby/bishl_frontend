import { GetServerSideProps } from 'next';
import apiClient from '../../../lib/apiClient';
import { SeasonValues } from '../../../types/TournamentValues';

// This page redirects to the current season
export default function TournamentRedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ params, res }) => {
  const tAlias = params?.tAlias as string;

  if (!tAlias) {
    return { notFound: true };
  }

  try {
    // Fetch seasons for the tournament
    const seasonsResponse = await apiClient.get(`/tournaments/${tAlias}/seasons`);
    const allSeasons = seasonsResponse.data || [];

    // Find current season (most recent published)
    const publishedSeasons = allSeasons
      .filter((s: SeasonValues) => s.published)
      .sort((a: SeasonValues, b: SeasonValues) => b.alias.localeCompare(a.alias));

    if (publishedSeasons.length === 0) {
      return { notFound: true };
    }

    const currentSeason = publishedSeasons[0];

    // Redirect to current season
    return {
      redirect: {
        destination: `/tournaments/${tAlias}/${currentSeason.alias}`,
        permanent: false, // Use temporary redirect since current season changes
      },
    };
  } catch (error) {
    console.error('Error fetching tournament seasons:', error);
    return { notFound: true };
  }
};