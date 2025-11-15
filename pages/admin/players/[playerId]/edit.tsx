import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import axios from 'axios';
import PlayerAdminForm from '../../../../components/admin/PlayerAdminForm';
import Layout from '../../../../components/Layout';
import SectionHeader from '../../../../components/admin/SectionHeader';
import { PlayerValues } from '../../../../types/PlayerValues';
import ErrorMessage from '../../../../components/ui/ErrorMessage';
import { ClubValues } from '../../../../types/ClubValues';
import useAuth from '../../../../hooks/useAuth';
import usePermissions from '../../../../hooks/usePermissions';
import { UserRole } from '../../../../lib/auth';
import LoadingState from '../../../../components/ui/LoadingState';
import apiClient from '../../../../lib/apiClient';

const Edit: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [clubs, setClubs] = useState<ClubValues[]>([]);
  const [player, setPlayer] = useState<PlayerValues | null>(null);
  const router = useRouter();
  const { playerId } = router.query;

  // 1. Auth redirect check
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (!hasAnyRole([UserRole.ADMIN, UserRole.LEAGUE_MANAGER])) {
      router.push('/');
    }
  }, [authLoading, user, hasAnyRole, router]);

  // 2. Data fetching
  useEffect(() => {
    if (authLoading || !user || !playerId) return;

    const fetchData = async () => {
      try {
        // Fetch clubs
        const clubsResponse = await apiClient.get('/clubs', {
          params: { active: true }
        });
        setClubs(clubsResponse.data);

        // Fetch player
        const playerResponse = await apiClient.get(`/players/${playerId}`);
        setPlayer(playerResponse.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Error fetching data:', error.message);
          setError('Fehler beim Laden der Daten');
        }
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [authLoading, user, playerId]);

  const onSubmit = async (values: PlayerValues) => {
    setError(null);
    setLoading(true);
    console.log('submitted values', values);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value instanceof FileList) {
          Array.from(value).forEach((file) => formData.append(key, file));
        } else if (Array.isArray(value)) {
          value.forEach((item) => formData.append(key, item));
        } else if (typeof value === 'object' && value !== null) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      });

      const response = await apiClient.patch(`/players/${player?._id}`, formData);
      if (response.status === 200) {
        router.push({
          pathname: `/admin/players`,
          query: { message: `Spieler <strong>${values.firstName} ${values.lastName}</strong> wurde erfolgreich aktualisiert.` }
        }, `/admin/players`);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Assuming a 304 Not Modified response would redirect to the list page with a message
        // If the error is not a 304, show the error message
        if (error.response?.status === 304) {
             router.push({
               pathname: `/admin/players`,
               query: { message: `Keine Änderungen für Spieler <strong>${values.firstName} ${values.lastName}</strong> vorgenommen.` }
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

  // 3. Loading state
  if (authLoading || dataLoading) {
    return <Layout><LoadingState /></Layout>;
  }

  // 4. Auth guard
  if (!hasAnyRole([UserRole.ADMIN, UserRole.LEAGUE_MANAGER])) return null;

  if (!player) {
    return <Layout><ErrorMessage error="Spieler nicht gefunden" onClose={() => router.push('/admin/players')} /></Layout>;
  }

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

  const sectionTitle = 'Spieler bearbeiten';

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
        clubs={clubs}
      />
    </Layout>
  );
};

export default Edit;