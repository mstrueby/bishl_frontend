// page to get one season and list all rounds
// /leaguemanager/tournaments/[tAlias]/[sAlias]
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from 'next/link';
import { GetStaticPropsContext } from 'next';
import { SeasonValues } from "../../../../../types/TournamentValues";
import LayoutAdm from "../../../../../components/LayoutAdm";
import navData from "../../../../../components/leaguemanager/navData";
import SuccessMessage from '../../../../../components/ui/SuccessMessage';
import Badge from '../../../../../components/ui/Badge';
import SubSectionHeader from '../../../../../components/leaguemanager/SubSectionHeader';

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

  return (
    <LayoutAdm
      navData={navData}
      sectionTitle={season.name}
      description="Saison"
      editLink={`/leaguemanager/tournaments/${tAlias}/${sAlias}/edit`}
      breadcrumbs={[
        { order: 1, name: "Wettbewerbe", url: `/leaguemanager/tournaments` },
        { order: 2, name: tAlias, url: `/leaguemanager/tournaments/${tAlias}` }
      ]}
    >
      {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}

      <div className="mt-5">
        <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">

          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{season?.name}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Alias</dt>
            <dd className="mt-1 text-sm text-gray-900">{season?.alias}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Published</dt>
            <dd className="mt-1 text-sm text-gray-900">{season?.published ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
      </div>

      <SubSectionHeader
        title="Runden"
        newLink={`/leaguemanager/tournaments/${tAlias}/${sAlias}/addRound/`}
      />

      <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Runde
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
              {season?.rounds.sort((a, b) => b.alias.localeCompare(a.alias))
                .map((round) => {
                  return (
                    <tr key={round.alias}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 mr-4">
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{round.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">
                        <Badge info={round.published === true ? 'aktiv' : 'inaktiv'} />
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link href={`/leaguemanager/tournaments/${tAlias}/${sAlias}/${round.alias}`}>
                          <a className="text-indigo-600 hover:text-indigo-900">Link<span className="sr-only">, {round.name}</span></a>
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
  const tournamentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments`);
  const tournaments = await tournamentsRes.json();
  let paths: { params: { tAlias: string; sAlias: string; } }[] = [];

  for (const tournament of tournaments) {
    const seasonsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournament.alias}/seasons/`);
    const seasons = await seasonsRes.json();
    const tournamentPaths = seasons.map((season: SeasonValues) => ({
      params: { tAlias: tournament.alias, sAlias: season.alias },
    }));
    paths = paths.concat(tournamentPaths);
  }

  return {
    paths,
    fallback: 'blocking',
  };
}
