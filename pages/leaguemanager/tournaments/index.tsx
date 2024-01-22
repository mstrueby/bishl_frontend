import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { TournamentFormValues } from "../../../types/TournamentFormValues";
import LayoutAdm from "../../../components/LayoutAdm";
import navData from "../../../components/leaguemanager/navData";
import SuccessMessage from '../../../components/ui/SuccessMessage';
import Badge from '../../../components/ui/Badge';


export default function Tournament({
  allTournamentData,
}: {
  allTournamentData: TournamentFormValues[];
}) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

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

  // Handler to close the success message
  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  const sortedTournaments = allTournamentData.sort((a, b) => a.name.localeCompare(b.name));
  
  // For each tournament, sort the seasons by year
  sortedTournaments.forEach(tournament => {
    if (tournament.seasons) {
      tournament.seasons.sort((a, b) => b.year - a.year);
    }
  });
  
  return (
    <LayoutAdm
      navData={navData}
      sectionTitle="Wettbewerbe"
      newLink="/leaguemanager/tournaments/add"
    >

      {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}

      <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Wettbewerb
                </th>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Saisons
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 text-center">
                  Status
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Bearbeiten</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {sortedTournaments && sortedTournaments.map((tournament) => {
                return (
                  <tr key={tournament.alias}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                      <div className="flex items-center">
                        <div className="">
                          <div className="font-medium text-gray-900">{tournament.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-xs text-left">
                      {tournament.seasons && tournament.seasons.map((season) => {
                        return (
                          <div 
                            key= {season.year}
                            className="text-gray-500">{season.year}</div>
                        )
                      }
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">
                      <Badge info={tournament.active === true ? 'aktiv' : 'inaktiv'} />
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <Link href={`/leaguemanager/tournaments/${tournament.alias}/edit`}>
                        <a className="text-indigo-600 hover:text-indigo-900">Bearbeiten<span className="sr-only">, {tournament.tinyName}</span></a>
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
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/`);
  const allTournamentData = await res.json();
  return {
    props: {
      allTournamentData,
      revalidate: 60,
    },
  };
};