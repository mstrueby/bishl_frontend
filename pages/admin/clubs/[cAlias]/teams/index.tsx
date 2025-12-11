import { useState, useEffect } from "react";
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { buildUrl } from 'cloudinary-build-url'
import { ClubValues, TeamValues } from '../../../../../types/ClubValues';
import Layout from '../../../../../components/Layout';
import SectionHeader from "../../../../../components/admin/SectionHeader";
import SuccessMessage from '../../../../../components/ui/SuccessMessage';
import DataList from '../../../../../components/admin/ui/DataList';
import { ageGroupConfig } from '../../../../../tools/consts';
import LoadingState from '../../../../../components/ui/LoadingState';
import useAuth from '../../../../../hooks/useAuth';
import usePermissions from '../../../../../hooks/usePermissions';
import { UserRole } from '../../../../../lib/auth';
import apiClient from '../../../../../lib/apiClient';

interface TeamsProps {}

const transformedUrl = (id: string) => buildUrl(id, {
  cloud: {
    cloudName: 'dajtykxvp',
  },
  transformations: {
    //effect: {
    //  name: 'grayscale',
    //},
    //effect: {
    //  name: 'tint',
    //  value: '60:blue:white'
    //}
  }
});

const Teams: NextPage<TeamsProps> = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [teams, setTeams] = useState<TeamValues[]>([]);
  const [club, setClub] = useState<ClubValues | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();
  const { cAlias } = router.query;

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
  useEffect(() => {
    if (authLoading || !user || !cAlias) return;

    const fetchData = async () => {
      try {
        setDataLoading(true);
        
        // Fetch club data
        const clubResponse = await apiClient.get(`/clubs/${cAlias}`);
        setClub(clubResponse.data);

        // Fetch teams data
        const teamsResponse = await apiClient.get(`/clubs/${cAlias}/teams`);
        setTeams(teamsResponse.data || []);
      } catch (error) {
        if (error) {
          console.error('Error fetching data:', error.message);
        }
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [authLoading, user, cAlias]);

  const fetchTeams = async () => {
    if (!club) return;
    
    try {
      const response = await apiClient.get(`/clubs/${club.alias}/teams`);
      setTeams(response.data || []);
    } catch (error) {
      if (error) {
        console.error('TEAMS: Error fetching teams:', error);
      }
    }
  };

  const toggleActive = async (clubAlias: string, teamId: string, currentStatus: boolean, logoUrl: string | null) => {
    try {
      const formData = new FormData();
      formData.append('active', (!currentStatus).toString());
      if (logoUrl) {
        formData.append('logoUrl', logoUrl);
      }

      const response = await apiClient.patch(`/clubs/${clubAlias}/teams/${teamId}`, formData);
      if (response.status === 200) {
        console.log(`Team ${teamId} successfully activated`);
        await fetchTeams();
      } else if (response.status === 304) {
        console.log('No changes were made to the team.');
      } else {
        console.error('Failed to activate team.');
      }
    } catch (error) {
      console.error('Error activating team:', error);
    }
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

  // Handler to close the success message
  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

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
  if (!club) {
    return (
      <Layout>
        <LoadingState />
      </Layout>
    );
  }

  const teamValues = teams
    .slice()
    .sort((a, b) => {
      const aGroup = ageGroupConfig.find(ag => ag.key === a.ageGroup);
      const bGroup = ageGroupConfig.find(ag => ag.key === b.ageGroup);
      const sortOrderDiff = (aGroup?.sortOrder || 0) - (bGroup?.sortOrder || 0);
      return sortOrderDiff !== 0 ? sortOrderDiff : (a.teamNumber || 0) - (b.teamNumber || 0);
    })
    .map((team: TeamValues) => ({
      ...team
    }));

  const dataLisItems = teamValues.map((team: TeamValues) => {
    return {
      _id: team._id,
      title: team.name,
      description: [team.ageGroup, team.fullName],
      alias: team.alias,
      image: {
        src: team.logoUrl ? team.logoUrl : (club.logoUrl ? club.logoUrl : 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.svg'),
        width: 48,
        height: 48,
        gravity: 'center',
        className: 'object-contain',
        radius: 0,
      },
      published: team.active,
      menu: [
        { edit: { onClick: () => router.push(`/admin/clubs/${club.alias}/teams/${team.alias}/edit`) } },
        { players: { onClick: () => router.push(`/admin/clubs/${club.alias}/teams/${team.alias}/players`) } },
        { active: { onClick: () => toggleActive(club.alias, team._id, team.active, null) } },
      ],
    }
  });

  const sectionTitle = 'Mannschaften';
  const sectionDescription = club.name.toUpperCase();
  const backLink = `/admin/clubs`;
  const newLink = `/admin/clubs/${club.alias}/teams/add`;
  const statuses = {
    Published: 'text-green-500 bg-green-500/20',
    Unpublished: 'text-gray-500 bg-gray-800/10',
    Archived: 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
  }


  return (
    <Layout>
      <SectionHeader
        title={sectionTitle}
        description={sectionDescription}
        backLink={backLink}
        newLink={newLink}
      />

      {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}

      <DataList
        items={dataLisItems}
        statuses={statuses}
        showStatusIndicator
        showThumbnails
        showThumbnailsOnMobiles
      />

    </Layout>
  );
};

export default Teams;