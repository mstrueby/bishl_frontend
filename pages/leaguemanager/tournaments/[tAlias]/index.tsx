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
import SubSectionHeader from '../../../../components/leaguemanager/SubSectionHeader';

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

      <SubSectionHeader
        title="Saisons"
        newLink= {`/leaguemanager/tournaments/${tAlias}/addSeasons/`}
      />
      
      <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Saison
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 text-center">
                  Status
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Link</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {tournament?.seasons && tournament?.seasons.sort((a, b) => b.alias.localeCompare(a.alias)).map((season) => {
                return (
                  <tr key={season.alias}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 mr-4">
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{season.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">
                      <Badge info={season.published === true ? 'aktiv' : 'inaktiv'} />
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <Link href={`/leaguemanager/tournaments/${tAlias}/${season.alias}`}>
                        <a className="text-indigo-600 hover:text-indigo-900">Link<span className="sr-only">, {season.name}</span></a>
                      </Link>
                    </td>
                  </tr>
                )
              }
              )}
            </tbody>
          </table>
        </div>
      </div>

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