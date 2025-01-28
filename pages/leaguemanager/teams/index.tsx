import { useState, useEffect } from "react";
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { buildUrl } from 'cloudinary-build-url'
import LayoutAdm from '../../../components/LayoutAdm';
import Badge from '../../../components/ui/Badge';
import { ClubValues, TeamValues } from '../../../types/ClubValues';
import SuccessMessage from '../../../components/ui/SuccessMessage';
import { navData } from '../../../components/leaguemanager/navData';
import ClubSelect from '../../../components/ui/ClubSelect';


export default function Teams({
  allClubsData
}: {
  allClubsData: ClubValues[];
}) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [teams, setTeams] = useState<TeamValues[]>([]);
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

  // Function to update the selected club and fetch its teams
  const onClubChange = async (clubAlias: string) => {
    // Fetch the teams for the selected club
    if (clubAlias) {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clubs/${clubAlias}`);
      const { teams: teamsData } = await response.json();
      setTeams(teamsData);
    } else {
      setTeams([]);
    }
  };

  // Handler to close the success message
  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  return (
    <LayoutAdm
      navData={navData}
      sectionTitle="Mannschaften"
      newLink={`/leaguemanager/teams/add`}
    >
      {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}

      {/* Dropdown to select a club */}
      <ClubSelect onClubChange={onClubChange} clubs={allClubsData} />

      <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Mannschaft
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
              {teams && teams.map((team) => {
                return (
                  <tr key={team.alias}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 mr-4">
                          <Image className="h-10 w-10 rounded-full"
                            src='https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'
                            alt={team.name}
                            objectFit="contain" height={50} width={50}
                          />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{team.fullName}</div>
                          <div className="text-gray-500">{team.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">
                      <Badge info={team.active === true ? 'aktiv' : 'inaktiv'} />
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <Link href={`/leaguemanager/teams/${team.alias}/edit`}>
                        <a className="text-indigo-600 hover:text-indigo-900">Bearbeiten<span className="sr-only">, {team.name}</span></a>
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

export const getServerSideProps: GetServerSideProps = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clubs/`);
  const allClubsData = await res.json();

  return {
    props: {
      allClubsData,
      revalidate: 60,
    }
  }
}