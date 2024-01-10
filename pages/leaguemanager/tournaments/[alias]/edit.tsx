// pages/leaguemanager/Tournaments/[alias]/edit.tsx
import { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import TournamentForm from '../../../../components/leaguemanager/TournamentForm';
import LayoutAdm from '../../../../components/LayoutAdm';
import { TournamentFormValues } from '../../../../types/TournamentFormValues';
import ErrorMessage from '../../../../components/ui/ErrorMessage';
import { navData } from '../../../../components/leaguemanager/navData';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + '/tournaments/';

interface EditProps {
  jwt: string,
  tournament: TournamentFormValues
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);
  const { alias } = context.params as { alias: string };

  // Fetch the existing Tournament data
  let tournament = null;
  try {
    const response = await axios.get(BASE_URL + alias, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    tournament = response.data;
  } catch (error) {
    // Handle error (e.g., not found)
    console.error('Could not fetch the tournament data');
  }

  return tournament ? { props: { jwt, tournament } } : { notFound: true };
};

const Edit: NextPage<EditProps> = ({ jwt, tournament }) => {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Handler for form submission
  const onSubmit = async (values: TournamentFormValues) => {
    setError(null);

    // Ignore seasons for update
    const { seasons, ...valuesToSend } = values;

    console.log(valuesToSend);
    try {
      const response = await axios.patch(BASE_URL + tournament._id, valuesToSend, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (response.status === 200) { // Assuming status 200 means success
        router.push({
          pathname: '/leaguemanager/tournaments',
          query: { message: `Der Wettbewerb ${valuesToSend.name} wurde erfolgreich aktualisiert.` }
        }, '/leaguemanager/tournaments');
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      setError('Ein Fehler ist aufgetreten.');
    }
  };

  const handleCancel = () => {
    router.push('/leaguemanager/tournaments');
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
  const initialValues: TournamentFormValues = {
    name: tournament?.name || '',
    alias: tournament?.alias || '',
    tinyName: tournament?.tinyName || '',
    ageGroup: tournament?.ageGroup || '',
    published: tournament?.published || false,
    active: tournament?.active || false,
    external: tournament?.external || false,
    //website: tournament?.website || '',
    seasons: tournament?.seasons.map(season => ({
      year: season.year,
      published: season.published,
      rounds: []
    })) || []
  };

  console.log(initialValues);

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

      <div><h2>Saisons</h2></div>
      {initialValues.seasons.map((season, index) => (
        <div key={index}>
          <h3>{season.year}</h3>
        </div>
      ))
      }

    </LayoutAdm >
  )
};

export default Edit;