// page to get one season and list all rounds
// /leaguemanager/tournaments/[tAlias]/[sAlias]
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GetStaticPropsContext } from 'next';
import { SeasonValues } from "../../../../../types/TournamentValues";
import LayoutAdm from "../../../../../components/LayoutAdm";
import navData from "../../../../../components/leaguemanager/navData";
import SuccessMessage from '../../../../../components/ui/SuccessMessage';
import SectionHeader from '../../../../../components/leaguemanager/SectionHeader';
import DescriptionList from '../../../../../components/leaguemanager/DescriptionList';
import DataList from '../../../../../components/leaguemanager/DataList';

export default function Season({
  season
}: {
  season: SeasonValues;
}) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const { tAlias, sAlias } = router.query;

  useEffect(() => {
    if (router.query.message) {
      setSuccessMessage(router.query.message as string);
      // Update the URL to remove the message from the query parameters
      const currentPath = router.pathname;
      const currentQuery = { ...router.query };
      delete currentQuery.message;
      router.replace({
        pathname: currentPath,
        query: currentQuery,
      }, undefined, { shallow: true });
    }
  }, [router]);

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  const seasonDetails = [
    { label: 'ID', value: season._id || '' },
    { label: 'Name', value: season.name || '' },
    { label: 'Veröffentlicht', value: season.published === true ? 'Ja' : 'Nein' },
  ];

  return (
    <LayoutAdm
      navData={navData}
      sectionTitle={season.name}
      description="Saison"
      editLink={`/leaguemanager/tournaments/${tAlias}/${sAlias}/edit`}
      breadcrumbs={[
        { order: 1, name: "Wettbewerbe", url: `/leaguemanager/tournaments` },
        { order: 2, name: tAlias as string, url: `/leaguemanager/tournaments/${tAlias}` }
      ]}
    >
      {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}

      <DescriptionList
        items={seasonDetails}
      />

      <SectionHeader
        title="Runden"
        newLink={`/leaguemanager/tournaments/${tAlias}/${sAlias}/addRound/`}
      />

    </LayoutAdm>

  )
}

export async function getStaticProps(context: GetStaticPropsContext) {
  // Check if 'params' exists and has the 'tAlias' and 'sAlias' properties
  const tAlias = context.params?.tAlias;
  const sAlias = context.params?.sAlias;

  if (typeof tAlias !== 'string' || typeof sAlias !== 'string') {
    // Handle the error appropriately
    return { notFound: true };
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tAlias}/seasons/${sAlias}`);
    if (!res.ok) {
      // Handle response errors, such as showing a message or logging
      console.error('Error fetching season:', res.statusText);
      return {
        notFound: true,
      };
    }
    const seasonData = await res.json();

    // Passing the correct prop 'season' here
    return {
      props: {
        season: seasonData,
      },
      // Optionally, set a revalidation time
      revalidate: 60
    };
  } catch (error) {
    // Handle the error appropriately
    console.error('Failed to fetch season data:', error);
    return {
      notFound: true,
    };
  }
}

export async function getStaticPaths() {
  let paths: { params: { tAlias: string; sAlias: string; } }[] = [];

  try {
    const tournamentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments`);
    if (!tournamentsRes.ok) {
      return { paths, fallback: 'blocking' };
    }
    const tournaments = await tournamentsRes.json();
    if (!Array.isArray(tournaments)) {
      return { paths, fallback: 'blocking' };
    }

    for (const tournament of tournaments) {
      try {
        const seasonsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournament.alias}/seasons`);
        if (!seasonsRes.ok) continue;
        const seasons = await seasonsRes.json();
        if (!Array.isArray(seasons)) continue;
        const tournamentPaths = seasons.map((season: SeasonValues) => ({
          params: { tAlias: tournament.alias, sAlias: season.alias },
        }));
        paths = paths.concat(tournamentPaths);
      } catch {
        continue;
      }
    }
  } catch {
    return { paths, fallback: 'blocking' };
  }

  return {
    paths,
    fallback: 'blocking',
  };
}
