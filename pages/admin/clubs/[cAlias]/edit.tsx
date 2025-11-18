import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import axios from 'axios';
import ClubForm from '../../../../components/admin/ClubForm';
import Layout from '../../../../components/Layout';
import SectionHeader from '../../../../components/admin/SectionHeader';
import { ClubValues } from '../../../../types/ClubValues';
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
  const [club, setClub] = useState<ClubValues | null>(null);
  const router = useRouter();
  const { cAlias } = router.query;

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
    if (authLoading || !user || !cAlias) return;

    const fetchData = async () => {
      try {
        const response = await apiClient.get(`/clubs/${cAlias}`);
        setClub(response.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Error fetching club:', error.message);
          setError('Fehler beim Laden des Vereins');
        }
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [authLoading, user, cAlias]);

  const onSubmit = async (values: ClubValues) => {
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        // Skip _id field and teams array
        if (key === '_id') return;
        if (key === 'teams') return;

        // Handle logo/logoUrl specially
        if (key === 'logo' || key === 'logoUrl') {
          if (value instanceof File) {
            // New file upload
            formData.append('logo', value);
          } else if (value === null) {
            // Image was removed - signal backend to delete
            formData.append('logoUrl', '');
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
      console.log('submitted values');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const response = await apiClient.patch(`/clubs/${club?._id}`, formData);
      if (response.status === 200) {
        router.push({
          pathname: `/admin/clubs`,
          query: { message: `Der Verein <strong>${values.name}</strong> wurde erfolgreich aktualisiert.` }
        }, `/admin/clubs`);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        router.push({
          pathname: `/admin/clubs`,
          query: { message: `Keine Änderungen für Verein <strong>${values.name}</strong> vorgenommen.` }
        }, `/admin/clubs`);
      } else {
        setError('Ein Fehler ist aufgetreten.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/admin/clubs`);
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

  if (!club) {
    return <Layout><ErrorMessage error="Verein nicht gefunden" onClose={() => router.push('/admin/clubs')} /></Layout>;
  }

  const initialValues: ClubValues = {
    _id: club._id || '',
    name: club.name || '',
    alias: club.alias || '',
    addressName: club.addressName || '',
    street: club.street || '',
    zipCode: club.zipCode || '',
    city: club.city || '',
    country: club.country || '',
    email: club.email || '',
    yearOfFoundation: club.yearOfFoundation || '',
    description: club.description || '',
    website: club.website || '',
    ishdId: club.ishdId || '',
    active: club.active || false,
    logoUrl: club.logoUrl || '',
    teams: club.teams || [],
    legacyId: club.legacyId || '',
  };

  const sectionTitle = 'Verein bearbeiten';

  return (
    <Layout>
      <SectionHeader title={sectionTitle} />

      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}

      <ClubForm
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