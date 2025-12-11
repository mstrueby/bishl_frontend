
import { useState, useEffect } from "react";
import { NextPage } from 'next';
import { useRouter } from 'next/router';
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
        if (error) {
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
      if (error) {
        console.error('Error fetching venues:', error);
      }
    }
  };

  const editVenue = (alias: string) => {
    router.push(`/admin/venues/${alias}/edit`);
  };

  const toggleActive = async (venueId: string, currentStatus: boolean, imageUrl: string | null) => {
    try {
      const formData = new FormData();
      formData.append('active', (!currentStatus).toString()); // Toggle the status
      if (imageUrl) {
        formData.append('imageUrl', imageUrl);
      }

      const response = await apiClient.patch(`/venues/${venueId}`, formData);
      if (response.status === 200) {
        // Handle successful response
        console.log(`Venue ${venueId} successfully activated`);
        await fetchVenues();
      } else if (response.status === 304) {
        // Handle not modified response
        console.log('No changes were made to the venue.');
      } else {
        // Handle error response
        console.error('Failed to publish venue.');
      }
    } catch (error) {
      console.error('Error publishing venue:', error);
    }
  }

  const deleteVenue = async (venueId: string) => {
    if (!venueId) return;
    try {
      const response = await apiClient.delete(`/venues/${venueId}`);

      if (response.status === 204) {
        console.log(`Venue ${venueId} successfully deleted.`);
        await fetchVenues();
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

  const venueValues = venues
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((venue: VenueValues) => ({
      ...venue
    }));

  const sectionTitle = 'Spielstätten';
  const newLink = '/admin/venues/add';
  const statuses = {
    Published: 'text-green-500 bg-green-500/20',
    Unpublished: 'text-gray-500 bg-gray-800/10',
    Archived: 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
  }

  const dataListItems = venueValues.map((venue: VenueValues) => {
    return {
      _id: venue._id,
      title: venue.name,
      alias: venue.alias,
      description: [venue.street, venue.zipCode + ' ' + venue.city],
      image: venue.imageUrl ? {
        src: venue.imageUrl,
        width: 128,
        height: 72,
        gravity: 'auto',
        className: "rounded-lg object-cover",
        radius: 18,
      } : undefined,
      published: venue.active,
      menu: [
        { edit: { onClick: () => editVenue(venue.alias) } }, 
        { active: { onClick: () => { toggleActive(venue._id, venue.active, venue.imageUrl || null) } } },
        { delete: { onClick: () => { deleteVenue(venue._id) } } }, 
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
        statuses={statuses}
        onDeleteConfirm={deleteVenue}
        deleteModalTitle="Spielstätte löschen"
        deleteModalDescription="Möchtest du die Spielstätte <strong>{{title}}</strong> wirklich löschen?"
        deleteModalDescriptionSubText="Dies kann nicht rückgängig gemacht werden."
        showThumbnails
        showStatusIndicator
      />
    </Layout>
  );
}

export default Venues;
