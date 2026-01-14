
import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import PlayerForm from '../../../../../components/admin/PlayerForm';
import Layout from '../../../../../components/Layout';
import SectionHeader from '../../../../../components/admin/SectionHeader';
import { PlayerValues } from '../../../../../types/PlayerValues';
import ErrorMessage from '../../../../../components/ui/ErrorMessage';
import LoadingState from '../../../../../components/ui/LoadingState';
import useAuth from '../../../../../hooks/useAuth';
import usePermissions from '../../../../../hooks/usePermissions';
import { UserRole } from '../../../../../lib/auth';
import apiClient from '../../../../../lib/apiClient';
import { getErrorMessage } from '../../../../../lib/errorHandler';

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
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!hasAnyRole([UserRole.ADMIN, UserRole.CLUB_ADMIN])) {
      router.push('/');
    }
  }, [authLoading, user, hasAnyRole, router]);

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
          console.error('Error fetching player:', getErrorMessage(error));
          setError(getErrorMessage(error));
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
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        const excludedFields = [
          '_id',
          'stats',
          'firstName',
          'lastName',
          'birthdate',
          'fullFaceReq',
          'source',
          'legacyId',
          'createDate',
          'ageGroup',
          'overAge',
          'nationality',
          'managedByISHD',
          'sex'
        ];
        if (excludedFields.includes(key)) return;

        // Handle image/imageUrl specially
        if (key === 'image' || key === 'imageUrl') {
          if (value instanceof File) {
            // New file upload
            formData.append('image', value);
          } else if (value === null) {
            // Image was removed - signal backend to delete
            formData.append('imageUrl', '');
          }
          // If value is a string (existing URL), don't append anything - backend keeps existing
          return;
        }

        // Handle File objects (from ImageUpload)
        if (value instanceof File) {
          formData.append(key, value);
          return;
        }
        // Handle FileList (legacy support)
        if (value instanceof FileList) {
          Array.from(value).forEach((file) => formData.append(key, file));
          return;
        }
        if (typeof value === 'object') {
          if (key === 'assignedTeams') {
            const cleanedTeams = value.map(
              (club: {
                teams: { jerseyNo: number | null; [key: string]: any }[];
              }) => ({
                ...club,
                teams: club.teams.map((team) => {
                  if (team.jerseyNo === null) {
                    const { jerseyNo, ...restTeam } = team;
                    return restTeam;
                  }
                  return team;
                }),
              }),
            );
            formData.append(key, JSON.stringify(cleanedTeams));
          } else {
            formData.append(key, JSON.stringify(value));
          }
        } else {
          formData.append(key, value);
        }
      });

      // Log formData fields
      console.log('FormData entries:', Array.from(formData.entries()));

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
      console.error('Error updating player:', getErrorMessage(error));
      setError(getErrorMessage(error));
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
  if (!hasAnyRole([UserRole.ADMIN, UserRole.CLUB_ADMIN]) || !player) {
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
    sex: player.sex || '',
    playUpTrackings: player.playUpTrackings || [],
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
