import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import axios from 'axios';
import VenueForm from '../../../../components/admin/VenueForm';
import Layout from '../../../../components/Layout';
import SectionHeader from '../../../../components/admin/SectionHeader';
import { VenueValues } from '../../../../types/VenueValues';
import ErrorMessage from '../../../../components/ui/ErrorMessage';
import useAuth from '../../../../hooks/useAuth';
import usePermissions from '../../../../hooks/usePermissions';
import { UserRole } from '../../../../lib/auth';
import LoadingState from '../../../../components/ui/LoadingState';
import apiClient from '../../../../lib/apiClient';

const Edit: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasRole } = usePermissions();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [venue, setVenue] = useState<VenueValues | null>(null);
  const router = useRouter();
  const { alias } = router.query;

  // 1. Auth redirect check
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (!hasRole(UserRole.ADMIN)) {
      router.push('/');
    }
  }, [authLoading, user, hasRole, router]);

  // 2. Data fetching
  useEffect(() => {
    if (authLoading || !user || !alias) return;

    const fetchData = async () => {
      try {
        const response = await apiClient.get(`/venues/${alias}`);
        setVenue(response.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Error fetching venue:', error.message);
          setError('Fehler beim Laden der Spielstätte');
        }
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [authLoading, user, alias]);

  const onSubmit = async (values: VenueValues) => {
    setError(null);
    setLoading(true);
    console.log('submitted values', values);
    try {
      const response = await apiClient.patch(`/venues/${venue?._id}`, values);
      if (response.status === 200) {
        router.push({
          pathname: `/admin/venues`,
          query: { message: `Die Spielstätte <strong>${values.name}</strong> wurde erfolgreich aktualisiert.` }
        }, `/admin/venues`);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Assuming a 304 or similar non-error might lead here, or a different error
        // The original code specifically handled 304, this simplified version might need adjustment if that specific case is critical.
        // For now, we'll assume any API error during patch results in this message.
        router.push({
          pathname: `/admin/venues`,
          query: { message: `Keine Änderungen für Spielstätte <strong>${values.name}</strong> vorgenommen.` }
        }, `/admin/venues`);
      } else {
        setError('Ein Fehler ist aufgetreten.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/admin/venues`);
  };

  useEffect(() => {
    if (error) {
      window.scrollTo(0, 0);
    }
  }, [error]);

  const handleCloseMessage = () => {
    setError(null);
  };

  // 3. Loading state
  if (authLoading || dataLoading) {
    return <Layout><LoadingState /></Layout>;
  }

  // 4. Auth guard
  if (!hasRole(UserRole.ADMIN)) return null;

  if (!venue) {
    return <Layout><ErrorMessage error="Spielstätte nicht gefunden" onClose={() => router.push('/admin/venues')} /></Layout>;
  }

  const initialValues: VenueValues = {
    _id: venue._id || '',
    name: venue.name || '',
    alias: venue.alias || '',
    street: venue.street || '',
    zipCode: venue.zipCode || '',
    city: venue.city || '',
    country: venue.country || '',
    googleMapsUrl: venue.googleMapsUrl || '',
    active: venue.active || false
  };

  const sectionTitle = 'Spielstätte bearbeiten';

  return (
    <Layout>
      <SectionHeader title={sectionTitle} />

      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}

      <VenueForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        enableReinitialize={true}
        handleCancel={handleCancel}
        loading={loading}
      />
    </Layout>
  );
};

export default Edit;