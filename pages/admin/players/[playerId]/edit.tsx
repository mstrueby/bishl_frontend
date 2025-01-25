// pages/leaguemanager/clubs/[alias]/edit.tsx
import { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import PlayerAdminForm from '../../../../components/admin/PlayerAdminForm';
import Layout from '../../../../components/Layout';
import SectionHeader from '../../../../components/admin/SectionHeader';
import { PlayerValues } from '../../../../types/PlayerValues';
import ErrorMessage from '../../../../components/ui/ErrorMessage';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + '/players/';

interface EditProps {
  jwt: string,
  player: PlayerValues,
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context) as string | undefined;
  const { playerId } = context.params as { playerId: string };

  if (!jwt) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  let player = null;
  try {
    // First check if user has required role
    const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
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

    // Fetch the existing club data
    const response = await axios.get(BASE_URL + playerId, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    player = response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching player:', error.message);
    }
  }
  return player ? { props: { jwt, player, playerId } } : { notFound: true };
};

const Edit: NextPage<EditProps> = ({ jwt, player }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  // Handler for form submission
  const onSubmit = async (values: PlayerValues) => {
    setError(null);
    setLoading(true);
    values.birthdate = new Date(values.birthdate).toISOString();
    console.log('submitted values', values);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        const excludedFields = ['_id', 'stats', 'source', 'legacyId', 'createDate', 'displayFirstName', 'displayLastName', 'assignedTeams'];
        if (excludedFields.includes(key)) return;
        if (key === 'image' && value instanceof File) {
          formData.append('image', value);
        } else if (value instanceof FileList) {
          Array.from(value).forEach((file) => formData.append(key, file));
        } else if (typeof value === 'object') {
          if (key === 'assignedTeams') {
            const cleanedTeams = value.map((club: { teams: { jerseyNo: number | null, [key: string]: any }[] }) => ({
              ...club,
              teams: club.teams.map(team => {
                if (team.jerseyNo === null) {
                  const { jerseyNo, ...restTeam } = team;
                  return restTeam;
                }
                return team;
              })
            }));
            formData.append(key, JSON.stringify(cleanedTeams));
          } else {
            formData.append(key, JSON.stringify(value));
          }
        } else {
          // Handle imageUrl specifically to ensure it's only appended if not null
          if (key === 'imageUrl' && value !== null) {
            formData.append(key, value);
          } else if (key !== 'imageUrl') {
            formData.append(key, value);
          }
        }
      });

      for (let pair of formData.entries()) {
        console.log(pair[0] + ', ' + pair[1]);
      }

      const response = await axios.patch(BASE_URL + player._id, formData, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        }
      });
      if (response.status === 200) {
        router.push({
          pathname: `/admin/players`,
          query: { message: `SpielerIn <strong>${values.firstName} ${values.lastName} </strong> wurde erfolgreich aktualisiert.` }
        }, `/admin/players`);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 304) {
          router.push({
            pathname: `/admin/players`,
            query: { message: `Keine Änderungen für SpielerIn <strong>${values.firstName} ${values.lastName}</strong> vorgenommen.` }
          }, `/admin/players`);
        } else {
          setError(error.response?.data?.detail || 'Ein Fehler ist aufgetreten.');
        }
      } else {
        setError('Ein Fehler ist aufgetreten.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/admin/players`);
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
  const initialValues: PlayerValues = {
    _id: player?._id || '',
    firstName: player?.firstName || '',
    lastName: player?.lastName || '',
    birthdate: player?.birthdate ? new Date(player.birthdate).toLocaleDateString('en-US') : '',
    displayFirstName: player?.displayFirstName || '',
    displayLastName: player?.displayLastName || '',
    nationality: player?.nationality || '',
    fullFaceReq: player?.fullFaceReq || false,
    assignedTeams: player?.assignedTeams || [],
    imageUrl: player?.imageUrl || '',
  };
  console.log("initial birthday", player.birthdate, new Date(player.birthdate).toLocaleDateString('en-US'), initialValues.birthdate)
  const sectionTitle = 'SpielerIn bearbeiten';

  // Render the form with initialValues and the edit-specific handlers
  return (
    <Layout>
      <SectionHeader title={sectionTitle} />

      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}

      <PlayerAdminForm
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