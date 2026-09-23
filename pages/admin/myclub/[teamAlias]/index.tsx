import { useState, useEffect } from "react";
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { buildUrl } from 'cloudinary-build-url'
import Layout from '../../../../components/Layout';
import SectionHeader from "../../../../components/admin/SectionHeader";
import SuccessMessage from '../../../../components/ui/SuccessMessage';
import ErrorMessage from '../../../../components/ui/ErrorMessage';
import DataList from '../../../../components/admin/ui/DataList';
import { getDataListItems } from '../../../../tools/playerItems';
import LoadingState from '../../../../components/ui/LoadingState';
import useAuth from '../../../../hooks/useAuth';
import usePermissions from '../../../../hooks/usePermissions';
import { UserRole } from '../../../../lib/auth';
import apiClient from '../../../../lib/apiClient';
import { useTeamPlayers, updateCachedPlayer } from '../../../../lib/teamPlayerCache';
import { getErrorMessage } from '../../../../lib/errorHandler';
import { licenceTypeBadgeColors } from '../../../../lib/constants';

const transformedUrl = (id: string) => buildUrl(id, {
  cloud: {
    cloudName: 'dajtykxvp',
  },
  transformations: {}
});

const TeamPage: NextPage = () => {
  const router = useRouter();
  const { teamAlias } = router.query;
  const { user, loading: authLoading } = useAuth();
  const { isAuthenticated, hasAnyRole } = usePermissions();
  const clubId = user?.club?.clubId;
  const resolvedTeamAlias =
    typeof teamAlias === 'string' ? teamAlias : null;
  const allowed = hasAnyRole([UserRole.ADMIN, UserRole.CLUB_ADMIN]);
  const { data, error: fetchError, isValidating, refresh } = useTeamPlayers(
    clubId, resolvedTeamAlias, !authLoading && isAuthenticated && allowed,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const editPlayer = (teamAlias: string, PlayerId: string) => {
    router.push(`/admin/myclub/${teamAlias}/${PlayerId}`);
  }

  const toggleActive = async (playerId: string, teamId: string, assignedTeams: any, imageUrl: string | null) => {
    try {
      const updatedAssignedTeams = assignedTeams.map((item: any) => ({
        clubId: item.clubId,
        teams: item.teams.map((teamInner: any) => {
          const updatedTeam: any = {
            teamId: teamInner.teamId,
            passNo: teamInner.passNo,
            source: teamInner.source,
            modifyDate: teamInner.modifyDate,
          };

          if (teamInner.jerseyNo !== undefined) {
            updatedTeam.jerseyNo = teamInner.jerseyNo;
          }

          if (teamInner.teamId === teamId) {
            updatedTeam.active = !teamInner.active;
          } else if (teamInner.active !== undefined) {
            updatedTeam.active = teamInner.active;
          }

          return updatedTeam;
        })
      }));

      const formData = new FormData();
      formData.append('assignedTeams', JSON.stringify(updatedAssignedTeams));
      if (imageUrl) {
        formData.append('imageUrl', imageUrl);
      }

      const response = await apiClient.patch(`/players/${playerId}`, formData);

      if (response.status === 200) {
        if (clubId && resolvedTeamAlias) {
          await updateCachedPlayer(clubId, resolvedTeamAlias, playerId, {
            // The PATCH payload omits assignment metadata used by the list.
            // Preserve it while applying the confirmed active-state change.
            assignedTeams: response.data?.assignedTeams || assignedTeams.map((item: any) => ({
              ...item,
              teams: item.teams.map((assignedTeam: any) =>
                assignedTeam.teamId === teamId
                  ? { ...assignedTeam, active: !assignedTeam.active }
                  : assignedTeam,
              ),
            })),
          });
        }
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      console.error('Error updating player status:', getErrorMessage(error));
      setError(getErrorMessage(error));
    }
  }

  useEffect(() => {
    if (router.query.message) {
      setSuccessMessage(router.query.message as string);
      const currentPath = router.pathname;
      const currentQuery = { ...router.query };
      delete currentQuery.message;
      router.replace({
        pathname: currentPath,
        query: currentQuery,
      }, undefined, { shallow: true });
    }
  }, [router]);

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  const handleCloseError = () => {
    setError(null);
  };

  if (authLoading) {
    return (
      <Layout>
        <LoadingState />
      </Layout>
    );
  }

  // Auth guard (shouldn't reach here due to redirect, but just in case)
  if (!allowed) {
    return null;
  }

  if (!data && !fetchError) {
    return (
      <Layout>
        <LoadingState />
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div role="alert" className="my-6 rounded-md bg-red-50 p-4 text-red-800">
          Die Mannschaft konnte nicht geladen werden: {getErrorMessage(fetchError)}
          <button type="button" disabled={isValidating} className="ml-3 underline disabled:opacity-50" onClick={() => void refresh()}>
            {isValidating ? 'Wird geladen …' : 'Erneut versuchen'}
          </button>
        </div>
      </Layout>
    );
  }

  const { club, team, players } = data;
  
  const dataListItems = getDataListItems(players, team, editPlayer, toggleActive, true);

  const sectionTitle = team.name ? team.name : 'Meine Mannschaft';
  const description = club.name ? club.name.toUpperCase() : 'Mein Verein';
  const statuses = {
    Published: 'text-green-500 bg-green-500/20',
    Unpublished: 'text-gray-500 bg-gray-800/10',
    Archived: 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
  }
  const backLink = '/admin/myclub';

  return (
    <Layout>
      <SectionHeader
        title={sectionTitle}
        description={description}
        backLink={backLink}
      />

      {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}
      {error && <ErrorMessage error={error} onClose={handleCloseError} />}
      {isValidating && <p role="status" className="mb-4 text-sm text-gray-600">Mannschaft wird aktualisiert …</p>}
      {fetchError && (
        <div role="alert" className="mb-4 rounded-md bg-yellow-50 p-4 text-sm text-yellow-900">
          Die Aktualisierung ist fehlgeschlagen. Die zuletzt geladenen Spieler bleiben sichtbar.
          <button type="button" disabled={isValidating} className="ml-3 underline disabled:opacity-50" onClick={() => void refresh()}>
            {isValidating ? 'Wird geladen …' : 'Erneut versuchen'}
          </button>
        </div>
      )}

      <DataList
        items={dataListItems}
        statuses={statuses}
        categories={licenceTypeBadgeColors}
        showThumbnails
        showThumbnailsOnMobiles
        showStatusIndicator
      />
    </Layout>
  );
};

export default TeamPage;