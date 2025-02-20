// pages/leaguemanager/clubs/[alias]/edit.tsx
import { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import TeamForm from '../../../../../../components/admin/TeamForm';
import Layout from '../../../../../../components/Layout';
import SectionHeader from '../../../../../../components/admin/SectionHeader';
import { ClubValues, TeamValues } from '../../../../../../types/ClubValues';
import ErrorMessage from '../../../../../../components/ui/ErrorMessage';

let BASE_URL = process.env['API_URL'];

interface EditProps {
  jwt: string,
  club: ClubValues,
  team: TeamValues,
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context) as string | undefined;
  const { cAlias } = context.params as { cAlias: string };
  const { tAlias } = context.params as { tAlias: string };

  if (!jwt) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  let club = null;
  let team = null;
  try {
    // First check if user has required role
    const userResponse = await axios.get(`${process.env.API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });

    const user = userResponse.data;
    if (!user.roles?.includes('ADMIN')) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }

    // Fetch club data
    const clubResponse = await axios.get(`${BASE_URL}/clubs/${cAlias}`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      }
    });
    club = clubResponse.data;

    // Fetch the existing team data
    const response = await axios.get(`${BASE_URL}/clubs/${cAlias}/teams/${tAlias}`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    team = response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching club:', error.message);
    }
  }
  return team ? { props: { jwt, team, club } } : { notFound: true };
};

const Edit: NextPage<EditProps> = ({ jwt, team, club }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  // Handler for form submission
  const onSubmit = async (values: TeamValues) => {
    setError(null);
    setLoading(true);
    console.log('submitted values', values);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value instanceof FileList) {
          Array.from(value).forEach((file) => formData.append(key, file));
        } else {
          // Handle imageUrl specifically to ensure it's only appended if not null
          if (key === 'logoUrl' && value !== null) {
            formData.append(key, value);
          } else if (key !== 'logoUrl') {
            formData.append(key, value);
          }
        }
      });

      for (let pair of formData.entries()) {
        console.log(pair[0] + ', ' + pair[1]);
      }

      const response = await axios.patch(`${BASE_URL}/clubs/${club.alias}/teams/${team._id}`, formData, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        }
      });
      if (response.status === 200) {
        router.push({
          pathname: `/admin/clubs/${club.alias}/teams/`,
          query: { message: `Mannschaft <strong>${values.name}</strong> wurde erfolgreich aktualisiert.` }
        }, `/admin/clubs/${club.alias}/teams/`);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        router.push({
          pathname: `/admin/clubs/${club.alias}/teams/`,
          query: { message: `Keine Änderungen für Mannschaft <strong>${values.name}</strong> vorgenommen.` }
        }, `/admin/clubs/${club.alias}/teams/`);
      } else {
        setError('Ein Fehler ist aufgetreten.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/admin/clubs/${club.alias}/teams/`);
  };

  useEffect(() => {
    if (error) {
      window.scrollTo(0, 0);
    }
  }, [error]);

  const handleCloseMessage = () => {
    setError(null);
  };

  // Form initial values with existing club data
  const initialValues: TeamValues = {
    _id: team?._id || '',
    name: team?.name || '',
    alias: team?.alias || '',
    fullName: team?.fullName || '',
    shortName: team?.shortName || '',
    tinyName: team?.tinyName || '',
    ageGroup: team?.ageGroup || '',
    teamNumber: team?.teamNumber || 0,
    active: team?.active || false,
    external: team?.external || false,
    ishdId: team?.ishdId || ''
  };

  const sectionTitle = 'Mannschaft bearbeiten';
  const sectionDescription = club.name.toUpperCase();

  // Render the form with initialValues and the edit-specific handlers
  return (
    <Layout>
      <SectionHeader
        title={sectionTitle}
        description={sectionDescription}
      />

      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}

      <TeamForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        enableReinitialize={true}
        handleCancel={handleCancel}
        loading={loading}
      />
    </Layout>
  );
};

export default Edit;