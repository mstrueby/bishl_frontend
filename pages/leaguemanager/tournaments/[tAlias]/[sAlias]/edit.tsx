// page to edit a season
// /leaguenmanager/tournaments/[tAlias]/[sAlias]/edit
import { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import SeasonForm from '../../../../components/leaguemanager/SeasonForm';
import LayoutAdm from '../../../../components/LayoutAdm';
import { SeasonFormValues } from '../../../../types/TournamentFormValues';
import ErrorMessage from '../../../../components/ui/ErrorMessage';
import { navData } from '../../../../components/leaguemanager/navData';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + '/tournaments/';

interface EditProps {
  jwt: string;
  season: SeasonFormValues
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);
  const { alias } = context.params as { alias: string };

  // Fetch the season data
  let season = null;
  try {
    const response = await axios.get(`${BASE_URL}${alias}/seasons`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    season = response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching season:', error.message);
    }
  }
  return season ? { props: { jwt, season } } : { notFound: true };
}

const Edit: NextPage<EditProps> = ({ jwt, season }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();


  const onSubmit = async (values: SeasonFormValues) => {
    setError(null);

    // Ignore Rounds for update
    const { rounds, ...valuesToSend } = values;
    console.log(valuesToSend);

    try {
      const response = await axios.patch(`${BASE_URL}${season._id}/seasons`, valuesToSend, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        }
      });

      if (response.status === 200) {
        router.push({
          pathname: '/leaguemanager/seasons',
          query: { message: `Die Saison ${values.alias} wurde erfolgreich aktualisiert.` }
        }, '/leaguemanager/seasons');
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      setError('Failed to update the venue.');
    }
  };
  
  const handleCancel = () => {
    router.push('leaguenmanager/seasons');
  };

  useEffect(() => {
    if (error) {
      window.scrollTo(0, 0);
    }
  }, [error]);

  const handleCloseMessage = () => {
    setError(null);
  };

  const initialValues: SeasonFormValues = {
    name: season?.name || '',
    alias: season?.alias || '',
    published: season?.published || false,
    rounds: season?.rounds || [],
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
      sectionTitle={`Saison bearbeiten`}
    >
      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}
      <SeasonForm {...formProps}
      />
    </LayoutAdm>
  );
};

export default Edit;