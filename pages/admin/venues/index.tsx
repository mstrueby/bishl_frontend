
import { useState, useEffect } from "react";
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import axios from 'axios';
import { VenueValues } from '../../../types/VenueValues';
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

const Venues: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [venues, setVenues] = useState<VenueValues[]>([]);
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
    
    if (!hasAnyRole([UserRole.ADMIN])) {
      router.push('/');
    }
  }, [authLoading, user, hasAnyRole, router]);

  // Data fetching
  useEffect(() => {
    if (authLoading || !user) return;
    
    const fetchVenues = async () => {
      try {
        const res = await apiClient.get('/venues');
        setVenues(res.data || []);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Error fetching venues:', error);
        }
      } finally {
        setDataLoading(false);
      }
    };
    fetchVenues();
  }, [authLoading, user]);

  const fetchVenues = async () => {
    try {
      const res = await apiClient.get('/venues');
      setVenues(res.data || []);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching venues:', error);
      }
    }
  };

  const editVenue = (alias: string) => {
    router.push(`/admin/venues/${alias}/edit`);
  };

  const deleteVenue = async (venueId: string) => {
    if (!venueId) return;
    try {
      const formData = new FormData();
      formData.append('deleted', 'true');

      const response = await apiClient.patch(`/venues/${venueId}`, formData);

      if (response.status === 200) {
        console.log(`Venue ${venueId} successfully deleted.`);
        await fetchVenues();
      } else if (response.status === 304) {
        console.log('No changes were made to the venue.');
      } else {
        console.error('Failed to delete venue.');
      }
    } catch (error) {
      console.error('Error deleting venue:', error);
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
        <SectionHeader title="Spielstätten" />
        <LoadingState />
      </Layout>
    );
  }

  // Auth guard
  if (!hasAnyRole([UserRole.ADMIN])) return null;

  const venue_values = venues
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((venue: VenueValues) => ({
      _id: venue._id,
      name: venue.name,
      alias: venue.alias,
      address: venue.address,
      city: venue.city,
      createUser: venue.createUser?.firstName + ' ' + venue.createUser?.lastName,
      createDate: new Date(new Date(venue.createDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString(),
      updateUser: venue.updateUser ? (venue.updateUser.firstName + ' ' + venue.updateUser.lastName) : '-',
      updateDate: new Date(new Date(venue.updateDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString(),
    }));

  const sectionTitle = 'Spielstätten';
  const newLink = '/admin/venues/add';

  const dataListItems = venue_values.map((venue) => {
    return {
      _id: venue._id,
      title: venue.name,
      alias: venue.alias,
      description: [venue.address + ', ' + venue.city, getFuzzyDate(venue.updateDate)],
      menu: [
        { edit: { onClick: () => editVenue(venue.alias) } },
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
        onDeleteConfirm={deleteVenue}
        deleteModalTitle="Spielstätte löschen"
        deleteModalDescription="Möchtest du die Spielstätte <strong>{{title}}</strong> wirklich löschen?"
        deleteModalDescriptionSubText="Dies kann nicht rückgängig gemacht werden."
      />
    </Layout>
  );
}

export default Venues;
