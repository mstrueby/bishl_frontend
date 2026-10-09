import { useState, useEffect, useCallback } from "react";
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { buildUrl } from 'cloudinary-build-url'
import { PlayerValues } from '../../../../../../../types/PlayerValues';
import Layout from '../../../../../../../components/Layout';
import SectionHeader from "../../../../../../../components/admin/SectionHeader";
import SuccessMessage from '../../../../../../../components/ui/SuccessMessage';
import DataList from '../../../../../../../components/admin/ui/DataList';
import { getDataListItems } from '../../../../../../../tools/playerItems';
import { ClubValues, TeamValues } from "../../../../../../../types/ClubValues";
import { PlusCircleIcon } from '@heroicons/react/24/solid';
import AddTeamPlayerDialog from '../../../../../../../components/admin/AddTeamPlayerDialog';
import LoadingState from '../../../../../../../components/ui/LoadingState';
import useAuth from '../../../../../../../hooks/useAuth';
import usePermissions from '../../../../../../../hooks/usePermissions';
import { UserRole } from '../../../../../../../lib/auth';
import apiClient from '../../../../../../../lib/apiClient';
import { getErrorMessage } from '../../../../../../../lib/errorHandler';

interface PlayersProps {}

const transformedUrl = (id: string) => buildUrl(id, {
  cloud: {
    cloudName: 'dajtykxvp',
  },
  transformations: {}
});

const Players: NextPage<PlayersProps> = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [players, setPlayers] = useState<PlayerValues[]>([]);
  const [team, setTeam] = useState<TeamValues | null>(null);
  const [club, setClub] = useState<ClubValues | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [refreshError, setRefreshError] = useState('');
  const [clubName, setClubName] = useState<string>('');
  const [totalPlayers, setTotalPlayers] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();
  const { cAlias, tAlias } = router.query;

  // Auth redirect check
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (!hasAnyRole([UserRole.ADMIN, UserRole.LEAGUE_ADMIN])) {
      router.push('/');
    }
  }, [authLoading, user, hasAnyRole, router]);

  // Data fetching
  const refreshPlayers = useCallback(async () => {
    const response = await apiClient.get(`/players/clubs/${cAlias}/teams/${tAlias}`, {
      params: { sortby: 'lastName', all: 'true' },
    });
    const list = response.data?.results || response.data || [];
    setPlayers(list);
    setTotalPlayers(response.data?.total ?? list.length);
  }, [cAlias, tAlias]);

  const fetchData = useCallback(async () => {
    if (authLoading || !user || !cAlias || !tAlias) return;

    try {
      setDataLoading(true);

      // Get club infos
      const clubResponse = await apiClient.get(`/clubs/${cAlias}`);
      setClubName(clubResponse.data?.name || '');
      setClub(clubResponse.data || null);

      // Get team infos
      const teamResponse = await apiClient.get(`/clubs/${cAlias}/teams/${tAlias}`);
      setTeam(teamResponse.data || null);

      // Get players
      await refreshPlayers();

    } catch (error) {
        console.error('Error fetching data:', getErrorMessage(error));
      } finally {
        setDataLoading(false);
      }
  }, [authLoading, user, cAlias, tAlias, refreshPlayers]);

  useEffect(() => {
    if (!authLoading && user && cAlias && tAlias) {
      fetchData();
    }
  }, [authLoading, user, cAlias, tAlias, fetchData]);

  const editPlayer = (teamAlias: string, playerId: string) => {
    router.push(`/admin/myclub/${teamAlias}/${playerId}`);
  }

  const toggleActive = async (playerId: string, teamId: string, assignedTeams: any, imageUrl: string | null) => {
    return null;
  }

  // Handler to close the success message
  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  useEffect(() => {
    if (router.query.message) {
      setSuccessMessage(router.query.message as string);
      // Update the URL to remove the message from the query parameters
      const currentPath = router.pathname;
      const currentQuery = { ...router.query };
      delete currentQuery.message;
      router.replace({
        pathname: currentPath,
        query: currentQuery,
      }, undefined, { shallow: true });
    }
  }, [router]);

  // Show loading state while checking auth or fetching data
  if (authLoading || dataLoading) {
    return (
      <Layout>
        <LoadingState />
      </Layout>
    );
  }

  // Auth guard
  if (!hasAnyRole([UserRole.ADMIN, UserRole.LEAGUE_ADMIN])) {
    return null;
  }

  // Data guard
  if (!team) {
    return (
      <Layout>
        <LoadingState />
      </Layout>
    );
  }

  const sectionTitle = team.name;
  const description = clubName.toUpperCase();
  const backLink = `/admin/clubs/${cAlias}/teams`;
  const statuses = {
    Published: 'text-green-500 bg-green-500/20',
    Unpublished: 'text-gray-500 bg-gray-800/10',
    Archived: 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
  }

  const dataLisItems = getDataListItems(players, team, editPlayer, toggleActive, false)

  return (
    <Layout>
      <SectionHeader
        title={sectionTitle}
        description={description}
        backLink={backLink}
        actions={
          <button type="button" disabled={!club} onClick={() => setAddDialogOpen(true)}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50">
            <PlusCircleIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Hinzufügen
          </button>
        }
      />

      {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}
      {refreshError && (
        <div role="alert" className="mb-4 text-sm text-red-600">
          {refreshError}
          <button type="button" className="ml-2 underline" onClick={async () => {
            try {
              await refreshPlayers();
              setRefreshError('');
            } catch (error) {
              setRefreshError(`Liste konnte nicht aktualisiert werden: ${getErrorMessage(error)}`);
            }
          }}>Erneut laden</button>
        </div>
      )}
      {addDialogOpen && club && (
        <AddTeamPlayerDialog club={club} team={team} onClose={() => setAddDialogOpen(false)}
          onAdded={async () => {
            setSuccessMessage('Spieler wurde der Mannschaft erfolgreich hinzugefügt.');
            setRefreshError('');
            try {
              await refreshPlayers();
            } catch (error) {
              setRefreshError(`Spieler wurde gespeichert, aber die Liste konnte nicht aktualisiert werden: ${getErrorMessage(error)}`);
            }
          }} />
      )}

      <DataList
        items={dataLisItems}
        statuses={statuses}
        showThumbnails
        showThumbnailsOnMobiles
        showStatusIndicator
      />

    </Layout>
  );
};

export default Players;