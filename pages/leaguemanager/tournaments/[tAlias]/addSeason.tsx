// page to add a new season to a tournament
// /leaguemanager/tournaments/[tAlias]/addSeason
import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import LayoutAdm from '../../../../components/LayoutAdm';
import SeasonForm from '../../../../components/leaguemanager/SeasonForm';
import { SeasonValues } from '../../../../types/TournamentValues';
import ErrorMessage from '../../../../components/ui/ErrorMessage';
import { navData } from '../../../../components/leaguemanager/navData';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + "/tournaments/"

interface AddProps {
  jwt: string;
  // allTournamentsData: TournamentFormValues[];
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const jwt = getCookie('jwt', { req, res });
  //const tournamentsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/`);
  //const allTournamentsData: TournamentFormValues[] = await tournamentsResponse.json();
  return { props: { jwt } };
}

export default function Add({ jwt }: AddProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const { tAlias } = router.query;

  const initialValues: SeasonValues = {
    name: '',
    alias: '',
    published: false,
    rounds: [],
  };

  const onSubmit = async (values: SeasonValues) => {
    setError(null);
    setLoading(true);
    console.log(values);
    //const url = selectedTournament ? `${BASE_URL}${selectedTournament.alias}/seasons/` : BASE_URL;
    try {
      const response = await axios({
        method: 'post',
        url: `${BASE_URL}${tAlias}/seasons/`,
        data: JSON.stringify(values),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      });
      if (response.status === 201) {
        router.push({
          pathname: `/leaguemanager/tournaments/${tAlias}`,
          query: { message: `Die neue Saison ${values.alias} wurde erfolgreich angelegt.` }
        }, `/leaguemanager/tournaments/${tAlias}`);
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
      pathname: `/leaguemanager/tournaments/${tAlias}`,
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
      <SeasonForm {...formProps} />
    </LayoutAdm>
  )
}