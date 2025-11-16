import { useState, useEffect } from "react";
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import axios from 'axios';
import { ClubValues } from '../../../types/ClubValues';
import Layout from "../../../components/Layout";
import SectionHeader from "../../../components/admin/SectionHeader";
import SuccessMessage from '../../../components/ui/SuccessMessage';
import { getFuzzyDate } from '../../../tools/dateUtils';
import DataList from '../../../components/admin/ui/DataList';
import apiClient from '../../../lib/apiClient';
import useAuth from '../../../hooks/useAuth';
import { UserRole } from '../../../lib/auth';
import usePermissions from '../../../hooks/usePermissions';
import LoadingState from '../../../components/ui/LoadingState';

const Clubs: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [clubs, setClubs] = useState<ClubValues[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();

  // Auth redirect check
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

  // Fetch clubs function for reuse
  const fetchClubs = async () => {
    try {
      const res = await apiClient.get('/clubs');
      setClubs(res.data || []);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching clubs:', error);
      }
    }
  };

  // Data fetching on mount
  useEffect(() => {
    if (authLoading || !user) return;

    const loadClubs = async () => {
      await fetchClubs();
      setDataLoading(false);
    };
    loadClubs();
  }, [authLoading, user]);

  const editClub = (alias: string) => {
    router.push(`/admin/clubs/${alias}/edit`);
  };

  const deleteClub = async (clubId: string) => {
    if (!clubId) return;
    try {
      const formData = new FormData();
      formData.append('deleted', 'true');

      const response = await apiClient.patch(`/clubs/${clubId}`, formData);

      if (response.status === 200) {
        console.log(`Club ${clubId} successfully deleted.`);
        await fetchClubs();
      } else if (response.status === 304) {
        console.log('No changes were made to the club.');
      } else {
        console.error('Failed to delete club.');
      }
    } catch (error) {
      console.error('Error deleting club:', error);
    }
  };

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

  // Loading state
  if (authLoading || dataLoading) {
    return (
      <Layout>
        <SectionHeader title="Vereine" />
        <LoadingState />
      </Layout>
    );
  }

  // Auth guard
  if (!hasAnyRole([UserRole.ADMIN, UserRole.LEAGUE_MANAGER])) return null;

  const club_values = clubs
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((club: ClubValues) => ({
      _id: club._id,
      name: club.name,
      alias: club.alias,
      logoUrl: club.logoUrl,
      createUser: club.createUser?.firstName + ' ' + club.createUser?.lastName,
      createDate: new Date(new Date(club.createDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString(),
      updateUser: club.updateUser ? (club.updateUser.firstName + ' ' + club.updateUser.lastName) : '-',
      updateDate: new Date(new Date(club.updateDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString(),
    }));

  const sectionTitle = 'Vereine';
  const newLink = '/admin/clubs/add';

  const dataListItems = club_values.map((club) => {
    return {
      _id: club._id,
      title: club.name,
      alias: club.alias,
      description: ["erstellt von " + club.createUser, getFuzzyDate(club.updateDate)],
      image: club.logoUrl ? {
        src: club.logoUrl,
        width: 128,
        height: 128,
        gravity: 'auto',
        className: "rounded-lg object-cover",
        radius: 18,
      } : undefined,
      menu: [
        { edit: { onClick: () => editClub(club.alias) } },
        { delete: { onClick: () => {} } },
      ],
    };
  });

  return (
    <Layout>
      <SectionHeader
        title={sectionTitle}
        newLink={newLink}
      />

      {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}

      <DataList
        items={dataListItems}
        onDeleteConfirm={deleteClub}
        deleteModalTitle="Verein löschen"
        deleteModalDescription="Möchtest du den Verein <strong>{{title}}</strong> wirklich löschen?"
        deleteModalDescriptionSubText="Dies kann nicht rückgängig gemacht werden."
        showThumbnails
      />
    </Layout>
  );
}

export default Clubs;