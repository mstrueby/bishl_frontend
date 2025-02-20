// page to add a new matchday to a round
// /leaguemanager/tournaments/[tAlias]/[sAlias]/[rAlias]/addMatchday
import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import LayoutAdm from '../../../../../../components/LayoutAdm';
import MatchdayForm from '../../../../../../components/leaguemanager/MatchdayForm';
import { MatchdayValues } from '../../../../../../types/TournamentValues';
import ErrorMessage from '../../../../../../components/ui/ErrorMessage';
import { navData } from '../../../../../../components/leaguemanager/navData';

let BASE_URL = process.env['API_URL'] + '/tournaments/';

interface AddProps {
  jwt: string;
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const jwt = getCookie('jwt', { req, res });
  return { props: { jwt } };
}

export default function Add({ jwt }: AddProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const { tAlias, sAlias, rAlias } = router.query;

  const initialValues: MatchdayValues = {
    name: '',
    alias: '',
    type: {
      key: '',
      value: '',
    },
    startDate: null,
    endDate: null,
    createStandings: false,
    createStats: false,
    published: false,
    matches: [],
  };

  const onSubmit = async (values: MatchdayValues) => {
    setError(null);
    setLoading(true);
    console.log(values);
    try {
      const response = await axios({
        method: 'post',
        url: `${BASE_URL}${tAlias}/seasons/${sAlias}/rounds/${rAlias}/matchdays/`,
        data: JSON.stringify(values),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      });
      if (response.status === 201) {
        router.push({
          pathname: `/leaguemanager/tournaments/${tAlias}/${sAlias}/${rAlias}/${values.alias}`,
          query: { message: `Das neue Spieltag ${values.alias} wurde erfolgreich angelegt.` }
        }, `/leaguemanager/tournaments/${tAlias}/${sAlias}/${rAlias}/${values.alias}`);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.detail || 'Ein Fehler ist aufgetreten.';
        setError(errorMessage);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push({
      pathname: `/leaguemanager/tournaments/${tAlias}/${sAlias}/${rAlias}`,
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
      sectionTitle='Neuer Spieltag'
    >
      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}
      <MatchdayForm {...formProps} />
    </LayoutAdm>
  )
}