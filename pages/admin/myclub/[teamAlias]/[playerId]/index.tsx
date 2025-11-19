
import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import PlayerForm from '../../../../../components/admin/PlayerFrom';
import Layout from '../../../../../components/Layout';
import SectionHeader from '../../../../../components/admin/SectionHeader';
import { PlayerValues } from '../../../../../types/PlayerValues';
import ErrorMessage from '../../../../../components/ui/ErrorMessage';
import LoadingState from '../../../../../components/ui/LoadingState';
import useAuth from '../../../../../hooks/useAuth';
import usePermissions from '../../../../../hooks/usePermissions';
import apiClient from '../../../../../lib/apiClient';
import axios from 'axios';

const Edit: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAuthenticated, hasAnyRole } = usePermissions();
  const router = useRouter();
  const { teamAlias, playerId } = router.query;

  const [player, setPlayer] = useState<PlayerValues | null>(null);
  const [clubId, setClubId] = useState<string>('');
  const [clubName, setClubName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [dataLoading, setDataLoading] = useState<boolean>(true);

  // Redirect if not authenticated or authorized
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    } else if (!authLoading && isAuthenticated && !hasAnyRole(['ADMIN', 'CLUB_ADMIN'])) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, hasAnyRole, router]);

  // Fetch player data
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && playerId && typeof playerId === 'string') {
      const fetchPlayer = async () => {
        try {
          setDataLoading(true);
          setClubId(user.club.clubId);
          setClubName(user.club.clubName);

          const response = await apiClient.get(`/players/${playerId}`);
          setPlayer(response.data);
        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error('Error fetching player:', error.message);
            setError('Fehler beim Laden des Spielers.');
          }
        } finally {
          setDataLoading(false);
        }
      };

      fetchPlayer();
    }
  }, [authLoading, isAuthenticated, user, playerId]);

  // Handler for form submission
  const onSubmit = async (values: PlayerValues) => {
    setError(null);
    setLoading(true);
    console.log('submitted values', values);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        const excludedFields = ['_id', 'stats', 'firstName', 'lastName', 'birthdate', 'fullFaceReq', 'source', 'legacyId', 'createDate', 'nationality', 'overage', 'ageGroup', 'managedByISHD'];
        if (excludedFields.includes(key)) return;
        if (key === 'image' && value instanceof File) {
          formData.append('image', value);
        } else if (value instanceof FileList) {
          Array.from(value).forEach((file) => formData.append(key, file));
        } else if (typeof value === 'object' && key !== 'imageUrl') {
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

      const response = await apiClient.patch(`/players/${player?._id}`, formData);
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

  // Show loading state while checking auth or fetching data
  if (authLoading || dataLoading) {
    return (
      <Layout>
        <LoadingState />
      </Layout>
    );
  }

  // Auth guard (shouldn't reach here due to redirect, but just in case)
  if (!isAuthenticated || !hasAnyRole(['ADMIN', 'CLUB_ADMIN']) || !player) {
    return null;
  }

  // Form initial values with existing player data
  const initialValues: PlayerValues = {
    _id: player._id || '',
    firstName: player.firstName || '',
    lastName: player.lastName || '',
    birthdate: player.birthdate || '',
    displayFirstName: player.displayFirstName || '',
    displayLastName: player.displayLastName || '',
    fullFaceReq: player.fullFaceReq || false,
    source: player.source || '',
    assignedTeams: player.assignedTeams || [],
    stats: player.stats || [],
    imageUrl: player.imageUrl || '',
    imageVisible: player.imageVisible || false, 
    legacyId: player.legacyId || 0,
    createDate: player.createDate || '',
    nationality: player.nationality || '',
    position: player.position || undefined,
    ageGroup: player.ageGroup || '',
    overAge: player.overAge || false,
    managedByISHD: player.managedByISHD || false,
    sex: player.sex || ''
  };

  const sectionTitle = `${initialValues.displayFirstName} ${initialValues.displayLastName}`;

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
