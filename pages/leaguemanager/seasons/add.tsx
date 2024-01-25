import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import LayoutAdm from '../../../components/LayoutAdm';
import SeasonForm from '../../../components/leaguemanager/SeasonForm';
import TournamentSelect from '../../../components/ui/TournamentSelect';
import { SeasonFormValues, TournamentFormValues } from '../../../types/TournamentFormValues';
import ErrorMessage from '../../../components/ui/ErrorMessage';
import { navData } from '../../../components/leaguemanager/navData';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + "/tournaments/"

interface AddProps {
  jwt: string;
  allTournamentsData: TournamentFormValues[];
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const jwt = getCookie('jwt', { req, res });
  const tournamentsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/`);
  const allTournamentsData: TournamentFormValues[] = await tournamentsResponse.json();
  return { props: { jwt, allTournamentsData } };
}

export default function Add({ jwt, allTournamentsData }: AddProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTournament, setSelectedTournament] = useState<TournamentFormValues | null>(null);
  const router = useRouter();

  const initialValues: SeasonFormValues = {
    year: new Date().getFullYear(),
    published: false,
    rounds: [],
  };

  // Read the tournament alias from the query parameters
  useEffect(() => {
    const tournamentAlias = router.query.tournament;
    if (tournamentAlias) {
      const selected = allTournamentsData.find(t => t.alias === tournamentAlias);
      if (selected) {
        setSelectedTournament(selected);
      }
      const currentPath = router.pathname;
      const currentQuery = { ...router.query };
      delete currentQuery.tournament;
      router.replace({
        pathname: currentPath,
        query: currentQuery,
      }, undefined, { shallow: true });
    }
  }, [router.query, allTournamentsData]);

  const onTournamentChange = (tournamentAlias: string) => {
    const tournament = allTournamentsData.find(t => t.alias === tournamentAlias);
    setSelectedTournament(tournament || null);
  };

  const onSubmit = async (values: SeasonFormValues) => {
    setLoading(true);
    console.log(values);
    const url = selectedTournament ? `${BASE_URL}${selectedTournament.alias}/seasons/` : BASE_URL;
    try {
      const response = await axios({
        method: 'post',
        url: url,
        data: JSON.stringify(values),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      });
      if (response.status === 201) {
        router.push({
          pathname: '/leaguemanager/seasons',
          query: { message: `Die neue Saison ${values.year} wurde erfolgreich angelegt.` }
        }, '/leaguemanager/seasons');
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // If the error has a response with data and a message, set that as the error
        const errorMessage = error.response.data?.message || error.response.data?.detail || 'Ein Fehler ist aufgetreten.';
        setError(errorMessage);
      } else {
        // Fallback error message if response is not present or no message is found
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push({
      pathname: '/leaguemanager/seasons',
      query: { tournament: selectedTournament?.alias }
    })
  }

  useEffect(() => {
    if (error) {
      // Scroll to the top of the page to show the error message
      window.scrollTo(0, 0);
    }
  }, [error]);

  // Handler to close the success message
  const handleCloseMessage = () => {
    setError(null);
  };

  const formProps = {
    initialValues,
    onSubmit,
    handleCancel,
    enableReinitialize: true,
  };

  return (
    <LayoutAdm
      navData={navData}
      sectionTitle='Neue Saison'
    >
      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}

      {/* Tournament Select Form */}
      <TournamentSelect
        selectedTournament={selectedTournament}
        onTournamentChange={onTournamentChange}
        allTournamentsData={allTournamentsData}
      />

      <SeasonForm {...formProps} />
    </LayoutAdm>
  )
}