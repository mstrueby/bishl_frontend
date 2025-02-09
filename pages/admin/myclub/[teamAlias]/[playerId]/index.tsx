// pages/leaguemanager/clubs/[alias]/edit.tsx
import { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import PlayerForm from '../../../../../components/admin/PlayerFrom';
import Layout from '../../../../../components/Layout';
import SectionHeader from '../../../../../components/admin/SectionHeader';
import { PlayerValues } from '../../../../../types/PlayerValues';
import ErrorMessage from '../../../../../components/ui/ErrorMessage';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'];

interface EditProps {
  jwt: string,
  player: PlayerValues,
  clubId: string,
  clubName: string,
  teamAlias: string,
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context) as string | undefined;
  const { playerId } = context.params as { playerId: string };
  const { teamAlias } = context.params as { teamAlias: string };

  if (!jwt) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  let player = null;
  let clubId = null;
  let clubName = null;
  try {
    // First check if user has required role
    const userResponse = await axios.get(`${BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });

    const user = userResponse.data;
    if (!user.roles?.includes('ADMIN') && !user.roles?.includes('CLUB_ADMIN')) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }
    clubId = user.club.clubId;
    clubName = user.club.clubName;

    // Fetch the existing player data
    const response = await axios.get(`${BASE_URL}/players/${playerId}`, {
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
  return player ? { props: { jwt, player, clubId, clubName, teamAlias } } : { notFound: true };
};

const Edit: NextPage<EditProps> = ({ jwt, player, clubId, clubName, teamAlias }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  // Handler for form submission
  const onSubmit = async (values: PlayerValues) => {
    setError(null);
    setLoading(true);
    console.log('submitted values', values);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        const excludedFields = ['_id', 'stats', 'firstName', 'lastName', 'birthdate', 'fullFaceReq', 'source', 'legacyId', 'createDate', 'nationality'];
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
      //formData.delete('teams');

      for (let pair of formData.entries()) {
        console.log(pair[0] + ', ' + pair[1]);
      }

      const response = await axios.patch(`${BASE_URL}/players/${player._id}`, formData, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        }
      });
      if (response.status === 200) {
        router.push({
          pathname: `/admin/myclub/${teamAlias}`,
          query: { message: `<strong>${values.displayFirstName} ${values.displayLastName}</strong> erfolgreich aktualisiert.` }
        }, `/admin/myclub/${teamAlias}`);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        router.push({
          pathname: `/admin/myclub/${teamAlias}`,
          query: { message: `Keine Änderungen für <strong>${values.displayFirstName} ${values.displayLastName}</strong> vorgenommen.` }
        }, `/admin/myclub/${teamAlias}`);
      } else {
        setError('Ein Fehler ist aufgetreten.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/admin/myclub/${teamAlias}`);
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
    birthdate: player?.birthdate || '',
    displayFirstName: player?.displayFirstName || '',
    displayLastName: player?.displayLastName || '',
    fullFaceReq: player?.fullFaceReq || false,
    source: player?.source || '', // Added missing property
    assignedTeams: player?.assignedTeams || [],
    stats: player?.stats || {}, // Added missing property
    imageUrl: player?.imageUrl || '',
    legacyId: player?.legacyId || 0,
    createDate: player?.createDate || '',
    nationality: player?.nationality || '', // Added missing property
    position: player?.position || '', // Added missing property
  };

  console.log("clubId", clubId)
  const sectionTitle = `${initialValues.displayFirstName} ${initialValues.displayLastName}`;
  // Render the form with initialValues and the edit-specific handlers
  return (
    <Layout>
      <SectionHeader title={sectionTitle.toUpperCase()} description={clubName.toUpperCase()} />

      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}

      <PlayerForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        enableReinitialize={true}
        handleCancel={handleCancel}
        loading={loading}
        clubId={clubId}
      />
    </Layout>
  );
};

export default Edit;