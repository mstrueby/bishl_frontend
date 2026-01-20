// page to edit a matchday
// /leaguenmanager/tournaments/[tAlias]/[sAlias]/[rAlias]/[mdAlias]|edit
import { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import MatchdayForm from '../../../../../../../components/leaguemanager/MatchdayForm';
import LayoutAdm from '../../../../../../../components/LayoutAdm';
import { MatchdayValues } from '../../../../../../../types/TournamentValues';
import ErrorMessage from '../../../../../../../components/ui/ErrorMessage';
import { navData } from '../../../../../../../components/leaguemanager/navData';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + '/tournaments/';

interface EditProps {
  jwt: string;
  matchday: MatchdayValues;
  tAlias: string;
  sAlias: string;
  rAlias: string;
  mdAlias: string;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);
  const { tAlias, sAlias, rAlias, mdAlias } = context.params as {
    tAlias: string, sAlias: string, rAlias: string, mdAlias: string
  };

  // Fetch the matchday data
  let matchday = null;
  try {
    const response = await axios.get(`${BASE_URL}${tAlias}/seasons/${sAlias}/rounds/${rAlias}/matchdays/${mdAlias}`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    matchday = response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching matchday:', error.message);
    }
  }
  return matchday ? { props: { jwt, matchday, tAlias, sAlias, rAlias, mdAlias } } : { notFound: true };
}

const Edit: NextPage<EditProps> = ({ jwt, matchday, tAlias, sAlias, rAlias, mdAlias }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const onSubmit = async (values: MatchdayValues) => {
    setError(null);

    // Ignore Matches for update
    const valuesToSend = values;
    console.log(valuesToSend);

    try {
      const response = await axios.patch(`${BASE_URL}${tAlias}/seasons/${sAlias}/rounds/${rAlias}/matchdays/${matchday._id}`, valuesToSend, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        }
      });

      if (response.status === 200) {
        router.push({
          pathname: `/leaguemanager/tournaments/${tAlias}/${sAlias}/${rAlias}/${mdAlias}`,
          query: {
            message: `Der Spieltag ${values.alias} wurde erfolgreich aktualisiert.`
          }
        }, `/leaguemanager/tournaments/${tAlias}/${sAlias}/${rAlias}/${mdAlias}`)
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      setError('Failed to update the matchday.');
    }
  };

  const handleCancel = () => {
    const { tAlias, sAlias, rAlias, mdAlias } = router.query as { tAlias: string, sAlias: string, rAlias: string, mdAlias: string };
    router.push(`/leaguemanager/tournaments/${tAlias}/${sAlias}/${rAlias}/${mdAlias}`);
  };

  useEffect(() => {
    if (error) {
      window.scrollTo(0, 0);
    }
  }, [error]);

  const handleCloseMessage = () => {
    setError(null);
  };

  const initialValues: MatchdayValues = {
    name: matchday?.name || '',
    alias: matchday?.alias || '',
    type: matchday?.type || '',
    createStandings: matchday?.createStandings || false,
    createStats: matchday?.createStats || false,
    startDate: matchday?.startDate || null,
    endDate: matchday?.endDate || null,
    published: matchday?.published || false,
    matchSettings: matchday?.matchSettings || []
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
      sectionTitle={`Spieltag bearbeiten`}
    >
      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}
      <MatchdayForm {...formProps} />
    </LayoutAdm>
  );
};

export default Edit;