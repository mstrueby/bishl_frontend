// page to get one round and list all matchdays
// /leaguemanager/tournaments/[tAlias]/[sAlias]/[rAlias]/
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from 'next/link';
import { GetStaticPropsContext } from 'next';
import { RoundValues } from "../../../../../../types/TournamentValues";
import LayoutAdm from "../../../../../../components/LayoutAdm";
import navData from "../../../../../../components/leaguemanager/navData";
import SuccessMessage from '../../../../../../components/ui/SuccessMessage';
import Badge from '../../../../../../components/ui/Badge';
import SubSectionHeader from '../../../../../../components/leaguemanager/SubSectionHeader';

export default function Round({
  round
}: {
  round: RoundValues;
}) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const { tAlias, sAlias, rAlias } = router.query;

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
      sectionTitle={round.name}
      description="Runde"
      editLink={`/leaguemanager/tournaments/${tAlias}/${sAlias}/${rAlias}/edit`}
      breadcrumbs={[
        { order: 1, name: "Wettbewerbe", url: `/leaguemanager/tournaments` },
        { order: 2, name: tAlias, url: `/leaguemanager/tournaments/${tAlias}` },
        { order: 3, name: sAlias, url: `/leaguemanager/tournaments/${tAlias}/${sAlias}` }
      ]}
    >
      {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}

      <SubSectionHeader
        title="Spieltage"
        newLink={`/leaguemanager/tournaments/${tAlias}/${sAlias}/${rAlias}/addMatchday/`}
      />

      <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Spieltag
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
              {round?.matchdays.sort((a, b) => b.alias.localeCompare(a.alias))
                .map((matchday) => {
                  return (
                    <tr key={matchday.alias}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 mr-4">
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{matchday.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">
                        <Badge info={matchday.published === true ? 'aktiv' : 'inaktiv'} />
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link href={`/leaguemanager/tournaments/${tAlias}/${sAlias}/${rAlias}/${matchday.alias}`}>
                          <a className="text-indigo-600 hover:text-indigo-900">Link<span className="sr-only">, {matchday.name}</span></a>
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
  const tAlias = context.params?.tAlias;
  const sAlias = context.params?.sAlias;
  const rAlias = context.params?.rAlias;

  if (typeof tAlias !== 'string' || typeof sAlias !== 'string' || typeof rAlias !== 'string') {
    return { notFound: true };
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tAlias}/seasons/${sAlias}/rounds/${rAlias}`);
    if (!res.ok) {
      console.error('Error fetching round:', res.statusText);
      return {
        notFound: true,
      };
    }
    const roundData = await res.json();

    return {
      props: {
        round: roundData,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error('Failed to fetch round data:', error);
    return {
      notFound: true,
    };
  }
}

export async function getStaticPaths() {
  const tournamentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments`);
  const tournaments = await tournamentsRes.json();
  let paths: { params: { tAlias: string; sAlias: string; rAlias: string; } }[] = [];

  for (const tournament of tournaments) {
    const seasonsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournament.alias}/seasons/`);
    const seasons = await seasonsRes.json();
    for (const season of seasons) {
      const roundsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournament.alias}/seasons/${season.alias}/rounds`);
      const rounds = await roundsRes.json();
      for (const round of rounds) {
        paths.push({
          params: { tAlias: tournament.alias, sAlias: season.alias, rAlias: round.alias },
        });
      }
    }
  }

  return {
    paths,
    fallback: 'blocking',
  };
}