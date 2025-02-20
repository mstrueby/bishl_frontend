// page to edit a tournament
// /leaguemanager/tournaments/[tAlias]/edit
import { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import TournamentForm from '../../../../components/leaguemanager/TournamentForm';
import LayoutAdm from '../../../../components/LayoutAdm';
import { TournamentValues } from '../../../../types/TournamentValues';
import ErrorMessage from '../../../../components/ui/ErrorMessage';
import { navData } from '../../../../components/leaguemanager/navData';

let BASE_URL = process.env['API_URL'] + '/tournaments/';

interface EditProps {
  jwt: string,
  tournament: TournamentValues
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);
  const { tAlias } = context.params as { tAlias: string };

  // Fetch the existing Tournament data
  let tournament = null;
  try {
    const response = await axios.get(BASE_URL + tAlias, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    tournament = response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching tournament:', error.message);
    }
  }
  return tournament ? { props: { jwt, tournament } } : { notFound: true };
};

const Edit: NextPage<EditProps> = ({ jwt, tournament }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  // Handler for form submission
  const onSubmit = async (values: TournamentValues) => {
    setError(null);

    // Ignore seasons and _id for update
    const { seasons, _id, ...valuesToSend } = values;

    console.log(valuesToSend);
    try {
      const response = await axios.patch(BASE_URL + tournament._id, valuesToSend, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (response.status === 200) {
        router.push({
          pathname: '/leaguemanager/tournaments',
          query: { message: `Der Wettbewerb ${valuesToSend.name} wurde erfolgreich aktualisiert.` }
        }, `/leaguemanager/tournaments/${valuesToSend.alias}`);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      setError('Ein Fehler ist aufgetreten.');
    }
  };

  const handleCancel = () => {
    const { tAlias } = router.query as { tAlias: string };
    router.push(`/leaguemanager/tournaments/${tAlias}`);
  };

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

  // Form initial values with existing tournament data
  const initialValues: TournamentValues = {
    _id: tournament._id,
    name: tournament?.name || '',
    alias: tournament?.alias || '',
    tinyName: tournament?.tinyName || '',
    ageGroup: tournament?.ageGroup || '',
    published: tournament?.published || false,
    active: tournament?.active || false,
    external: tournament?.external || false,
    seasons: [],
    //website: tournament?.website || '',
  };




  // Render the form with initialValues and the edit-specific handlers
  return (
    <LayoutAdm
      navData={navData}
      sectionTitle={`Wettbewerb bearbeiten`}
    >

      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}

      <TournamentForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        enableReinitialize={true}
        handleCancel={handleCancel}
      />

    </LayoutAdm >
  )
};

export default Edit;