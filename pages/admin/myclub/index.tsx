import { useState, useEffect } from "react";
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { buildUrl } from 'cloudinary-build-url';
import Layout from "../../../components/Layout";
import SectionHeader from "../../../components/admin/SectionHeader";
import SuccessMessage from '../../../components/ui/SuccessMessage';
import DataList from '../../../components/admin/ui/DataList';
import apiClient from '../../../lib/apiClient';
import useAuth from '../../../hooks/useAuth';
import { UserRole } from '../../../lib/auth';
import usePermissions from '../../../hooks/usePermissions';
import LoadingState from '../../../components/ui/LoadingState';
import { ageGroupConfig } from '../../../tools/consts';
import { ClubValues, TeamValues } from '../../../types/ClubValues';

const MyClub: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [club, setClub] = useState<ClubValues | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();

  // Success message handling
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

  // Auth redirect check
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (!hasAnyRole([UserRole.CLUB_ADMIN, UserRole.ADMIN])) {
      router.push('/');
    }
  }, [authLoading, user, hasAnyRole, router]);

  // Data fetching
  useEffect(() => {
    if (authLoading || !user) return;

    const fetchClub = async () => {
      try {
        if (!user.club?.clubId) {
          setDataLoading(false);
          return;
        }
        const res = await apiClient.get(`/clubs/id/${user.club.clubId}`);
        setClub(res.data || null);
      } catch (error) {
        if (error) {
          console.error('Error fetching club:', error);
        }
      } finally {
        setDataLoading(false);
      }
    };
    fetchClub();
  }, [authLoading, user]);

  // Loading state
  if (authLoading || dataLoading) {
    return (
      <Layout>
        <SectionHeader title="Mein Verein" />
        <LoadingState />
      </Layout>
    );
  }

  // Auth guard
  if (!hasAnyRole([UserRole.CLUB_ADMIN, UserRole.ADMIN])) return null;

  if (!user.club) {
    return (
      <Layout>
        <SectionHeader title="Mein Verein" />
        <p className="text-gray-500">Du bist keinem Verein zugeordnet.</p>
      </Layout>
    );
  }

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  const sectionTitle = club?.name || user.club.clubName || 'Mein Verein';
  const sectionDescription = 'MANNSCHAFTEN';
  
  const statuses = {
    Published: 'text-green-500 bg-green-500/20',
    Unpublished: 'text-gray-500 bg-gray-800/10',
    Archived: 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
  };

  // Sort and transform teams
  const teamValues = club?.teams
    ? club.teams
        .slice()
        .sort((a, b) => {
          const aGroup = ageGroupConfig.find(ag => ag.key === a.ageGroup);
          const bGroup = ageGroupConfig.find(ag => ag.key === b.ageGroup);
          const sortOrderDiff = (aGroup?.sortOrder || 0) - (bGroup?.sortOrder || 0);
          return sortOrderDiff !== 0 ? sortOrderDiff : (a.teamNumber || 0) - (b.teamNumber || 0);
        })
    : [];

  const dataListItems = teamValues.map((team: TeamValues) => {
    const logoUrl = team.logoUrl || club?.logoUrl || 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.svg';
    
    return {
      _id: team._id,
      title: team.name,
      description: [team.ageGroup, team.fullName],
      alias: team.alias,
      image: {
        src: logoUrl,
        width: 48,
        height: 48,
        gravity: 'center',
        className: 'object-contain',
        radius: 0,
      },
      published: team.active,
      menu: [
        { players: { onClick: () => router.push(`/admin/myclub/${team.alias}`) } },
      ],
    };
  });

  return (
    <Layout>
      <SectionHeader
        title={sectionTitle}
        description={sectionDescription}
      />

      {successMessage && (
        <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />
      )}

      <DataList
        items={dataListItems}
        statuses={statuses}
        showStatusIndicator
        showThumbnails
        showThumbnailsOnMobiles
      />
    </Layout>
  );
}

export default MyClub;