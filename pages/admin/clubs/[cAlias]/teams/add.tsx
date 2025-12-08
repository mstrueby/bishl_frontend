import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { ClubValues, TeamValues } from '../../../../../types/ClubValues';
import TeamForm from '../../../../../components/admin/TeamForm';
import Layout from '../../../../../components/Layout';
import SectionHeader from "../../../../../components/admin/SectionHeader";
import ErrorMessage from '../../../../../components/ui/ErrorMessage';
import LoadingState from '../../../../../components/ui/LoadingState';
import useAuth from '../../../../../hooks/useAuth';
import usePermissions from '../../../../../hooks/usePermissions';
import { UserRole } from '../../../../../lib/auth';
import apiClient from '../../../../../lib/apiClient';
import { getErrorMessage } from '../../../../../lib/errorHandler';

const Add: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [club, setClub] = useState<ClubValues | null>(null);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const { cAlias } = router.query;

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
    if (authLoading || !user || !cAlias) return;

    const fetchClub = async () => {
      try {
        const response = await apiClient.get(`/clubs/${cAlias}`);
        setClub(response.data);
      } catch (error) {
        console.error('Error fetching club:', error);
        setError('Fehler beim Laden des Vereins.');
      } finally {
        setDataLoading(false);
      }
    };
    fetchClub();
  }, [authLoading, user, cAlias]);

  const initialValues: TeamValues = {
    _id: '',
    name: '',
    alias: '',
    fullName: '',
    shortName: '',
    tinyName: '',
    ageGroup: '',
    teamNumber: 1,
    active: false,
    external: false,
    logoUrl: '',
    ishdId: '',
    legacyId: 0,
  };

  const onSubmit = async (values: TeamValues) => {
    if (!club) return;

    setError(null);
    setLoading(true);
    console.log(values);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, value?.toString() || '');
      });

      const response = await apiClient.post(`/clubs/${club.alias}/teams`, formData);

      if (response.status === 201) {
        router.push({
          pathname: `/admin/clubs/${club.alias}/teams`,
          query: { message: `Mannschaft <strong>${values.name}</strong> wurde erfolgreich angelegt.` }
        });
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (club) {
      router.push(`/admin/clubs/${club.alias}/teams`);
    }
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
  if (authLoading || dataLoading) {
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

  if (!club) {
    return (
      <Layout>
        <ErrorMessage error="Verein nicht gefunden" onClose={() => router.push('/admin/clubs')} />
      </Layout>
    );
  }

  const sectionTitle = 'Neue Mannschaft';
  const sectionDescription = club.name.toUpperCase();

  return (
    <Layout>
      <SectionHeader
        title={sectionTitle}
        description={sectionDescription}
      />
      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}
      <TeamForm
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