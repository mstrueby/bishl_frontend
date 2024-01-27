import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { TournamentFormValues, SeasonFormValues } from "../../../types/TournamentFormValues";
import LayoutAdm from "../../../components/LayoutAdm";
import navData from "../../../components/leaguemanager/navData";
import SuccessMessage from '../../../components/ui/SuccessMessage';
import Badge from '../../../components/ui/Badge';
import TournamentSelect from '../../../components/ui/TournamentSelect';


export default function Seasons({
  allTournamentsData
}: {
  allTournamentsData: TournamentFormValues[];
}) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<SeasonFormValues[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<TournamentFormValues | null>(null);
  const router = useRouter();
  const { tournament } = router.query;

  const fetchSeasons = async (tournamentAlias: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentAlias}/seasons/`);
      const seasonsData = await response.json();
      setSeasons(seasonsData);
    } catch (error) {
      console.error('Failed to fetch seasons', error);
      setSeasons([]);
    }
  };

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

  useEffect(() => {
    // Function to set the ListBox to tournament with this alias
    const findTournamentByAlias = (alias: string | string[]) => {
      const foundTournament = allTournamentsData.find(t => t.alias === alias);
      if (foundTournament) {
        setSelectedTournament(foundTournament);
      }
    };
    // Get tournament alias from the query and set ListBox
    if (tournament) {
      findTournamentByAlias(tournament);
    }
    if (router.query.tournament) {
      const currentPath = router.pathname;
      const currentQuery = { ...router.query };
      delete currentQuery.tournament;
      router.replace({
        pathname: currentPath,
        query: currentQuery,
      }, undefined, { shallow: true });
    }
  }, [router.query, allTournamentsData]);

  // useEffect to fetch tournament's seasons when a tournament is selected
  useEffect(() => {
    if (selectedTournament && selectedTournament.alias) {
      fetchSeasons(selectedTournament.alias);
    } else {
      // No tournament is selected, so clear the seasons.
      setSeasons([]);
    }
  }, [selectedTournament]);

  const onTournamentChange = async (tournament: TournamentFormValues) => {
    if (tournament) {
      console.log("onchange")
      setSelectedTournament(tournament);
      //  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournament.alias}/seasons/`);
      //  //const { seasons: seasonsData } = await response.json();
      //  const seasonsData = await response.json();
      //  setSeasons(seasonsData);
      //  console.log(seasonsData);
      //} else {
      //  setSeasons([]);
    }
  };

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  // Adjusted to include tournament alias when adding a new season
  const addSeasonLink = selectedTournament && selectedTournament.alias ? `/leaguemanager/seasons/add?tournament=${selectedTournament.alias}` : `/leaguemanager/seasons/add`;


  return (
    <LayoutAdm
      navData={navData}
      sectionTitle="Saisons"
      newLink={addSeasonLink}
    >
      {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}

      {/* Dropdown to select a TOURNAMENT */}
      <TournamentSelect
        selectedTournament={selectedTournament}
        onTournamentChange={onTournamentChange}
        allTournamentsData={allTournamentsData}
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
                  <span className="sr-only">Bearbeiten</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {seasons && seasons.sort((a, b) => b.alias - a.alias).map((season) => {
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
                      <Link href={`/leaguemanager/seasons/${season.alias}/edit`}>
                        <a className="text-indigo-600 hover:text-indigo-900">Bearbeiten<span className="sr-only">, {season.name}</span></a>
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
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments`);
  const allTournamentsData = await response.json();
  return {
    props: {
      allTournamentsData,
      revalidate: 60,
    },
  };
};