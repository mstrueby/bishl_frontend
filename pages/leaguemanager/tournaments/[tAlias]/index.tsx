// page to get one tournament and list all seasons
// /leaguemanager/tournaments/[tAlias]
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetStaticPropsContext } from 'next';
import { TournamentValues, } from '../../../../types/TournamentValues';
import LayoutAdm from '../../../../components/LayoutAdm';
import navData from '../../../../components/leaguemanager/navData';
import SuccessMessage from '../../../../components/ui/SuccessMessage';
import SectionHeader from '../../../../components/leaguemanager/SectionHeader';
import DescriptionList from '../../../../components/leaguemanager/DescriptionList';
import DataList from '../../../../components/leaguemanager/DataList';

export default function Tournament({
  tournament,
}: {
  tournament: TournamentValues;
}) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const { tAlias } = router.query;

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

  const tournamentDetails = [
    { label: 'ID', value: tournament._id },
    { label: 'Name', value: tournament.name },
    { label: 'Altersklasse', value: tournament.ageGroup },
    { label: 'Abkürzung', value: tournament.tinyName },
    { label: 'Veröffentlicht', value: tournament.published === true ? 'Ja' : 'Nein' },
    { label: 'Aktiv', value: tournament.active === true ? 'Ja' : 'Nein' },
    { label: 'Extern', value: tournament.external === true ? 'Ja' : 'Nein' },
  ]

  const dataListItems = tournament.seasons
    .slice()
    .sort((a, b) => b.alias.localeCompare(a.alias))
    .map((season) => ({
      name: season.name,
      published: season.published,
      href: `/leaguemanager/tournaments/${tAlias}/${season.alias}`,
    }));

  return (
    <LayoutAdm
      navData={navData}
      sectionTitle={tournament?.name}
      description="Wettbewerb"
      editLink= {`/leaguemanager/tournaments/${tAlias}/edit`}
      breadcrumbs={[
        {order: 1, name: 'Wettbewerbe', url: '/leaguemanager/tournaments'}
      ]}
    >
      {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}
      
      <DescriptionList
        items= {tournamentDetails}
      />

      <SectionHeader
        title="Saisons"
        newLink= {`/leaguemanager/tournaments/${tAlias}/addSeasons/`}
      />
      
      <DataList
        items={dataListItems}
      />

    </LayoutAdm>
  )

}


// Replace `getServerSideProps` with `getStaticProps`
export async function getStaticProps(context: GetStaticPropsContext) {
  // Check if 'params' exists and has the 'tAlias' property
  const tAlias = context.params?.tAlias;

  if (typeof tAlias !== 'string') {
    // Handle the error appropriately
    // You could return a 'notFound' or a default value, depending on your requirements
    return { notFound: true };
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tAlias}`);
    const tournamentData = await res.json();

    return {
      props: {
        tournament: tournamentData,
      },
      // Optionally, set a revalidation time
      revalidate: 60 
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
}

// Use `getStaticPaths` to define which paths will be pre-rendered
export async function getStaticPaths() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments`);
  const tournaments = await res.json();
  // Generate paths with `tAlias` parameter
  const paths = tournaments.map((tournament: TournamentValues) => ({
    params: { tAlias: tournament.alias },
  }));
  return {
    paths,
    fallback: 'blocking', // Can be 'blocking' or 'false' or 'true'
  };
};