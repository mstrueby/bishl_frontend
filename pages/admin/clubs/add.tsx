
import { useState, useEffect } from 'react'
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import axios from 'axios';
import { ClubValues } from '../../../types/ClubValues';
import ClubForm from '../../../components/admin/ClubForm';
import Layout from '../../../components/Layout';
import SectionHeader from "../../../components/admin/SectionHeader";
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

  const initialValues: ClubValues = {
    _id: '',
    name: '',
    alias: '',
    addressName: '',
    street: '',
    zipCode: '',
    city: '',
    country: 'Deutschland',
    email: '',
    yearOfFoundation: '',
    description: '',
    website: '',
    ishdId: '',
    active: false,
    logoUrl: '',
    legacyId: '',
    teams: [],
  };

  const onSubmit = async (values: ClubValues) => {
    setError(null);
    setLoading(true);
    console.log('submitted values', values);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      const response = await apiClient.post('/clubs/', formData);
      if (response.status === 201) {
        router.push({
          pathname: '/admin/clubs',
          query: { message: `Verein <strong>${values.name}</strong> wurde erfolgreich angelegt.` },
        }, '/admin/clubs');
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.detail || 'Ein Fehler ist aufgetreten.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/clubs');
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

  const sectionTitle = 'Neuer Verein';

  return (
    <Layout>
      <SectionHeader title={sectionTitle} />
      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}
      <ClubForm 
        initialValues={initialValues}
        onSubmit={onSubmit}
        enableReinitialize={false}
        handleCancel={handleCancel}
        loading={loading}
      />
    </Layout>
  );
};

export default Add;
