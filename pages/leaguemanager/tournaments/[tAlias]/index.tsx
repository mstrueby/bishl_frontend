// page to get one tournament and list all seasons
// /leaguemanager/tournaments/[tAlias]
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { GetStaticPropsContext } from 'next';
import { TournamentValues, } from '../../../../types/TournamentValues';
import LayoutAdm from '../../../../components/LayoutAdm';
import navData from '../../../../components/leaguemanager/navData';
import SuccessMessage from '../../../../components/ui/SuccessMessage';
import Badge from '../../../../components/ui/Badge';
import SectionHeader from '../../../../components/leaguemanager/SectionHeader';
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
      
      <div className="mt-5">
        <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">ID</dt>
            <dd className="mt-1 text-sm text-gray-900">{tournament._id}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{tournament.name}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Alias</dt>
            <dd className="mt-1 text-sm text-gray-900">{tournament.alias}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Tiny Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{tournament.tinyName}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Age Group</dt>
            <dd className="mt-1 text-sm text-gray-900">{tournament.ageGroup}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Published</dt>
            <dd className="mt-1 text-sm text-gray-900">{tournament.published ? 'Yes' : 'No'}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Active</dt>
            <dd className="mt-1 text-sm text-gray-900">{tournament.active ? 'Yes' : 'No'}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">External</dt>
            <dd className="mt-1 text-sm text-gray-900">{tournament.external ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
      </div>

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