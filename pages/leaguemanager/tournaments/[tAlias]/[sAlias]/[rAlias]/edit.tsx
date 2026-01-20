// page to edit a round
// /leaguenmanager/tournaments/[tAlias]/[sAlias]/[rAlias]/edit
import { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import RoundForm from '../../../../../../components/leaguemanager/RoundForm';
import LayoutAdm from '../../../../../../components/LayoutAdm';
import { RoundValues } from '../../../../../../types/TournamentValues';
import ErrorMessage from '../../../../../../components/ui/ErrorMessage';
import { navData } from '../../../../../../components/leaguemanager/navData';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + '/tournaments/';

interface EditProps {
  jwt: string;
  round: RoundValues;
  tAlias: string;
  sAlias: string;
  rAlias: string;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);
  const { tAlias, sAlias, rAlias } = context.params as { tAlias: string, sAlias: string, rAlias: string };

  // Fetch the round data
  let round = null;
  try {
    const response = await axios.get(`${BASE_URL}${tAlias}/seasons/${sAlias}/rounds/${rAlias}`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    round = response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching round:', error.message);
    }
  }
  return round ? { props: { jwt, round, tAlias, sAlias, rAlias } } : { notFound: true };
}

const Edit: NextPage<EditProps> = ({ jwt, round, tAlias, sAlias, rAlias }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const onSubmit = async (values: RoundValues) => {
    setError(null);
    
    // Ignore Matchdays for update
    const valuesToSend = values;
    console.log(valuesToSend);

    try {
      const response = await axios.patch(`${BASE_URL}${tAlias}/seasons/${sAlias}/rounds/${round._id}`, valuesToSend, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        }
      });

      if (response.status === 200) {
        router.push({
          pathname: `/leaguemanager/tournaments/${tAlias}/${sAlias}/${rAlias}`,
          query: {
            message: `Die Runde ${values.alias} wurde erfolgreich aktualisiert.` }
          }, `/leaguemanager/tournaments/${tAlias}/${sAlias}/${rAlias}`)
        } else {
          setError('Ein unerwarteter Fehler ist aufgetreten.');
        }
      } catch (error) {
        setError('Failed to update the round.');
      }
  };

  const handleCancel = () => {
    const { tAlias, sAlias, rAlias } = router.query as { tAlias: string, sAlias: string, rAlias: string };
    router.push(`/leaguemanager/tournaments/${tAlias}/${sAlias}/${rAlias}`);
  };

  useEffect(() => {
    if (error) {
      window.scrollTo(0, 0);
    }
  }, [error]);

  const handleCloseMessage = () => {
    setError(null);
  };

  const initialValues: RoundValues = {
    name: round?.name || '',
    alias: round?.alias || '',
    createStandings: round?.createStandings || false,
    createStats: round?.createStats || false,
    startDate: round?.startDate || null,
    endDate: round?.endDate || null,
    matchdaysType: round?.matchdaysType || '',
    matchdaysSortedBy: round?.matchdaysSortedBy || '',
    published: round?.published || false,
    matchSettings: round?.matchSettings || []
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
      sectionTitle={`Runde bearbeiten`}
    >
      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}
      <RoundForm {...formProps} />
    </LayoutAdm>
  );
};

export default Edit;