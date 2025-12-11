import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
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
        if (error) {
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
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        // Skip _id field
        if (key === '_id') return;

        // Handle image/imageUrl specially
        if (key === 'image' || key === 'imageUrl') {
          if (value instanceof File) {
            // New file upload
            formData.append('image', value);
          } else if (value === null) {
            // Image was removed - signal backend to delete
            formData.append('imageUrl', '');
          }
          // If value is a string (existing URL), don't append anything - backend keeps existing
          return;
        }

        // Handle File objects (from ImageUpload)
        if (value instanceof File) {
          formData.append(key, value);
          return;
        }
        // Handle FileList (legacy support)
        if (value instanceof FileList) {
          Array.from(value).forEach((file) => formData.append(key, file));
          return;
        }
        // Handle boolean values - always include them
        if (typeof value === 'boolean') {
          formData.append(key, value.toString());
          return;
        }
        // For other values, skip if empty
        if (value !== null && value !== undefined && value !== '') {
          formData.append(key, value.toString());
        }
      });

      // Log filtered FormData fields
      console.log('FormData entries:', Array.from(formData.entries()));
      
      const response = await apiClient.patch(`/venues/${venue?._id}`, formData);
      if (response.status === 200) {
        router.push({
          pathname: `/admin/venues`,
          query: { message: `Die Spielstätte <strong>${values.name}</strong> wurde erfolgreich aktualisiert.` }
        }, `/admin/venues`);
      }
    } catch (error: any) {
      if (error.response?.status === 304) {
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
    shortName: venue.shortName || '',
    street: venue.street || '',
    zipCode: venue.zipCode || '',
    city: venue.city || '',
    country: venue.country || '',
    latitude: venue.latitude || 0,
    longitude: venue.longitude || 0,
    imageUrl: venue.imageUrl || '',
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