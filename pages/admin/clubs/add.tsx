import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import LayoutAdm from '../../../components/LayoutAdm';
import ClubForm from '../../../components/admin/ClubForm';
import useAuth from '../../../hooks/useAuth';
import usePermissions from '../../../hooks/usePermissions';
import LoadingState from '../../../components/ui/LoadingState';
import ErrorMessage from '../../../components/ui/ErrorMessage';
import { UserRole } from '../../../lib/auth';
import { ClubValues } from '../../../types/ClubValues';
import apiClient from '../../../lib/apiClient';
import { getErrorMessage } from '../../../lib/errorHandler';

const initialClubValues: ClubValues = {
  _id: '',
  name: '',
  alias: '',
  addressName: '',
  street: '',
  zipCode: '',
  city: '',
  country: 'DE',
  email: '',
  yearOfFoundation: '',
  description: '',
  website: '',
  ishdId: '',
  active: true,
  logoUrl: '',
  legacyId: '',
  teams: []
};

export default function AddClubPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [error, setError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

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

  useEffect(() => {
    if (error) {
      window.scrollTo(0, 0);
    }
  }, [error]);

  const handleSubmit = async (values: ClubValues) => {
    setError(null);
    setFormLoading(true);

    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (key === '_id' || key === 'teams') return;
        if (value instanceof File) {
          formData.append(key, value);
          return;
        }
        if (value instanceof FileList) {
          Array.from(value).forEach((file) => formData.append(key, file));
          return;
        }
        if (typeof value === 'boolean') {
          formData.append(key, value.toString());
          return;
        }
        if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      const response = await apiClient.post('/clubs', formData);
      if (response.status === 201) {
        router.push({
          pathname: '/admin/clubs',
          query: { message: `Der neue Verein <strong>${values.name}</strong> wurde erfolgreich angelegt.` }
        }, '/admin/clubs');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/clubs');
  };

  const handleCloseMessage = () => {
    setError(null);
  };

  if (authLoading) {
    return (
      <LayoutAdm
        navData={[]}
        sectionTitle="Verein hinzufügen"
        breadcrumbs={[
          { order: 1, name: 'Vereine', url: '/admin/clubs' },
          { order: 2, name: 'Hinzufügen', url: '/admin/clubs/add' },
        ]}
      >
        <LoadingState />
      </LayoutAdm>
    );
  }

  if (!hasAnyRole([UserRole.ADMIN])) {
    return null;
  }

  return (
    <LayoutAdm
      navData={[]}
      sectionTitle="Verein hinzufügen"
      breadcrumbs={[
        { order: 1, name: 'Vereine', url: '/admin/clubs' },
        { order: 2, name: 'Hinzufügen', url: '/admin/clubs/add' },
      ]}
    >
      <Head>
        <title>Verein hinzufügen | BISHL Admin</title>
      </Head>

      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}

      <div className="space-y-10 divide-y divide-gray-900/10">
        <ClubForm
          initialValues={initialClubValues}
          onSubmit={handleSubmit}
          enableReinitialize={false}
          handleCancel={handleCancel}
          loading={formLoading}
        />
      </div>
    </LayoutAdm>
  );
}
