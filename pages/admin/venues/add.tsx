
import { useState, useEffect } from 'react'
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import SectionHeader from "../../../components/admin/SectionHeader";
import VenueForm from '../../../components/admin/VenueForm'
import { VenueValues } from '../../../types/VenueValues';
import ErrorMessage from '../../../components/ui/ErrorMessage';
import LoadingState from '../../../components/ui/LoadingState';
import useAuth from '../../../hooks/useAuth';
import usePermissions from '../../../hooks/usePermissions';
import { UserRole } from '../../../lib/auth';
import apiClient from '../../../lib/apiClient';

const Add: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
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

  const initialValues: VenueValues = {
    _id: '',
    name: '',
    alias: '',
    shortName: '',
    street: '',
    zipCode: '',
    city: '',
    country: 'Deutschland',
    latitude: 0,
    longitude: 0,
    imageUrl: '',
    active: false,
  };

  const onSubmit = async (values: VenueValues) => {
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        // Skip _id field
        if (key === '_id') return;
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
        if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      // Log filtered FormData fields
      console.log('submitted values');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }
      
      const response = await apiClient.post('/venues', formData);
      if (response.status === 201) {
        router.push({
          pathname: '/admin/venues',
          query: { message: `Die neue Spielfläche <strong>${values.name}</strong> wurde erfolgreich angelegt.` }
        }, '/admin/venues');
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      if (error) {
        setError(error?.response?.data.detail || 'Ein Fehler ist aufgetreten.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/venues');
  };

  useEffect(() => {
    if (error) {
      window.scrollTo(0, 0);
    }
  }, [error]);

  const handleCloseMessage = () => {
    setError(null);
  };

  // Loading state
  if (authLoading) {
    return (
      <Layout>
        <LoadingState />
      </Layout>
    );
  }

  // Auth guard
  if (!hasAnyRole([UserRole.ADMIN])) {
    return null;
  }

  const sectionTitle = 'Neue Spielfläche';

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
}

export default Add;
