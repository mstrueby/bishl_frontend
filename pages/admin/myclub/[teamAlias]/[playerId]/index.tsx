import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import PlayerForm from '../../../../../components/admin/PlayerForm';
import Layout from '../../../../../components/Layout';
import SectionHeader from '../../../../../components/admin/SectionHeader';
import WkoRules from '../../../../../components/admin/wko/WkoRules';
import { PlayerValues } from '../../../../../types/PlayerValues';
import ErrorMessage from '../../../../../components/ui/ErrorMessage';
import LoadingState from '../../../../../components/ui/LoadingState';
import useAuth from '../../../../../hooks/useAuth';
import usePermissions from '../../../../../hooks/usePermissions';
import { UserRole } from '../../../../../lib/auth';
import apiClient from '../../../../../lib/apiClient';
import { getErrorMessage } from '../../../../../lib/errorHandler';
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

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
  const [wkoRules, setWkoRules] = useState<any[]>([]);
  const [dynamicRules, setDynamicRules] = useState<any>(null);
  const [assignmentWindow, setAssignmentWindow] = useState<any>(null);

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

  useEffect(() => {
    if (!authLoading && isAuthenticated && user && playerId && typeof playerId === 'string') {
      const fetchData = async () => {
        try {
          setDataLoading(true);
          setClubId(user.club.clubId);
          setClubName(user.club.clubName);

          const [playerResponse, wkoResponse, assignmentWindowResponse] = await Promise.all([
            apiClient.get(`/players/${playerId}`),
            apiClient.get('/players/wko-rules'),
            apiClient.get('/configs/player_assignment_window')
          ]);
          
          setPlayer(playerResponse.data);
          
          // The API returns { success: true, data: { wko_rules: [...] } } based on attached file
          const responseData = wkoResponse.data;
          if (responseData?.data?.wko_rules) {
            setWkoRules(responseData.data.wko_rules);
            setDynamicRules(responseData.data.dynamic_rules || null);
          } else if (responseData?.wko_rules) {
            setWkoRules(responseData.wko_rules);
            setDynamicRules(responseData.dynamic_rules || null);
          }

          setAssignmentWindow(assignmentWindowResponse.data);
        } catch (error) {
          console.error('Error fetching data:', getErrorMessage(error));
          setError(getErrorMessage(error));
        } finally {
          setDataLoading(false);
        }
      };

      fetchData();
    }
  }, [authLoading, isAuthenticated, user, playerId]);

  const onSubmit = async (values: PlayerValues) => {
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        const excludedFields = [
          '_id', 'stats', 'firstName', 'lastName', 'birthdate', 'fullFaceReq',
          'source', 'legacyId', 'createDate', 'ageGroup', 'overAge', 'nationality', 'sex'
        ];
        if (excludedFields.includes(key)) return;

        if (key === 'image' || key === 'imageUrl') {
          if (value instanceof File) {
            formData.append('image', value);
          } else if (value === null) {
            formData.append('imageUrl', '');
          }
          return;
        }

        if (value instanceof File) {
          formData.append(key, value);
          return;
        }
        if (value instanceof FileList) {
          Array.from(value).forEach((file) => formData.append(key, file));
          return;
        }
        if (typeof value === 'object') {
          if (key === 'assignedTeams') {
            const cleanedTeams = value.map(
              (club: { teams: { jerseyNo: number | null; [key: string]: any }[] }) => ({
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

  const handlePlayerUpdate = (updatedPlayer: PlayerValues) => {
    setPlayer(updatedPlayer);
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

  if (authLoading || dataLoading) {
    return (
      <Layout>
        <LoadingState />
      </Layout>
    );
  }

  if (!hasAnyRole([UserRole.ADMIN, UserRole.CLUB_ADMIN]) || !player) {
    return null;
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
    sex: player.sex || '',
    playUpTrackings: player.playUpTrackings || [],
    suspensions: player.suspensions || []
  };

  const sectionTitle = `${initialValues.displayFirstName} ${initialValues.displayLastName}`;

  return (
    <Layout>
      <SectionHeader 
        title={sectionTitle} 
        description={clubName.toLocaleUpperCase()}
        backLink={`/admin/myclub/${teamAlias}`}
      />

      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}

      <PlayerForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        onPlayerUpdate={handlePlayerUpdate}
        enableReinitialize={true}
        handleCancel={handleCancel}
        loading={loading}
        clubId={clubId}
        clubName={clubName}
      />

      <WkoRules rules={wkoRules} dynamicRules={dynamicRules} assignmentWindow={assignmentWindow} />

      <div className="mt-8 flex justify-end py-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          <ArrowUturnLeftIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
          Zurück
        </button>
      </div>
      
    </Layout>
  );
};

export default Edit;
