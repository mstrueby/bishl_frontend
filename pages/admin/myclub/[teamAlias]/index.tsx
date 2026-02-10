import { useState, useEffect, useCallback } from "react";
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { buildUrl } from 'cloudinary-build-url'
import { ClubValues, TeamValues } from '../../../../types/ClubValues';
import { PlayerValues } from '../../../../types/PlayerValues';
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

  const [club, setClub] = useState<ClubValues | null>(null);
  const [team, setTeam] = useState<TeamValues | null>(null);
  const [players, setPlayers] = useState<PlayerValues[]>([]);
  const [totalPlayers, setTotalPlayers] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const currentPage = parseInt(router.query.page as string) || 1;

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

  const fetchData = useCallback(async () => {
    if (!user || !teamAlias || typeof teamAlias !== 'string') return;

    try {
      setLoading(true);

      // Get club by user's clubId
      const clubResponse = await apiClient.get(`/clubs/id/${user.club.clubId}`);
      const clubData = clubResponse.data?.data || clubResponse.data;
      setClub(clubData);

      // Get team by alias
      const teamResponse = await apiClient.get(`/clubs/${clubData.alias}/teams/${teamAlias}`);
      const teamData = teamResponse.data?.data || teamResponse.data;
      setTeam(teamData);

      // Get players of team
      const playersResponse = await apiClient.get(`/players/clubs/${clubData.alias}/teams/${teamAlias}`, {
        params: {
          sortby: 'lastName',
          all: 'true'
        }
      });

      setPlayers(playersResponse.data?.results || playersResponse.data || []);
      setTotalPlayers(playersResponse.data?.total || 0);

    } catch (error) {
      console.error('Error fetching data:', getErrorMessage(error));
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [user, teamAlias]);

  const fetchPlayers = useCallback(async (page: number) => {
    if (!club || !team) return;

    try {
      const playersResponse = await apiClient.get(`/players/clubs/${club.alias}/teams/${team.alias}`, {
        params: {
          page,
          sortby: 'lastName',
          all: 'true'
        }
      });
      setPlayers(playersResponse.data?.results || playersResponse.data || []);
    } catch (error) {
      console.error('Error fetching players:', getErrorMessage(error));
      setError(getErrorMessage(error));
    }
  }, [club, team]);

  const handlePageChange = async (page: number) => {
    await router.push({
      pathname: router.pathname,
      query: { ...router.query, page }
    });
    await fetchPlayers(page);
  };

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
        console.log(`Player ${playerId} status successfully toggled for team ${teamId}`);
        await fetchPlayers(currentPage);
      } else if (response.status === 304) {
        console.log('No changes were made to the player status.');
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

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      fetchData();
    }
  }, [authLoading, isAuthenticated, user, fetchData]);

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  const handleCloseError = () => {
    setError(null);
  };

  // Show loading state while checking auth or fetching data
  if (authLoading || loading || !club || !team) {
    return (
      <Layout>
        <LoadingState />
      </Layout>
    );
  }

  // Auth guard (shouldn't reach here due to redirect, but just in case)
  if (!hasAnyRole([UserRole.ADMIN, UserRole.CLUB_ADMIN])) {
    return null;
  }

  
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