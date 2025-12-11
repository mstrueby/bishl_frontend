import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import LayoutAdm from '../../../components/LayoutAdm';
import ClubForm from '../../../components/admin/ClubForm';
import useAuth from '../../../hooks/useAuth';
import usePermissions from '../../../hooks/usePermissions';
import LoadingState from '../../../components/ui/LoadingState';
import ErrorState from '../../../components/ui/ErrorState';
import { UserRole } from '../../../lib/auth';
import { ClubValues } from '../../../types/ClubValues';
import apiClient from '../../../lib/apiClient';

const initialClubValues: ClubValues = {
  _id: '',
  name: '',
  alias: '',
  fullName: '',
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
  legacyId: 0,
};

export default function AddClubPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Auth redirect
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (!hasAnyRole([UserRole.ADMIN])) {
      router.push('/');
      return;
    }

    setIsAuthorized(true);
  }, [authLoading, user, hasAnyRole, router]);

  const handleSubmit = async (values: ClubValues) => {
    setFormLoading(true);
    try {
      await apiClient.post('/clubs', values);
      router.push('/admin/clubs');
    } catch (error) {
      console.error('Error creating club:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/clubs');
  };

  // Show loading state while checking auth
  if (authLoading || !isAuthorized) {
    return (
      <LayoutAdm
        navData={[]}
        sectionTitle="Verein hinzufügen"
        breadcrumbs={[
          { order: 1, name: 'Vereine', url: '/admin/clubs' },
          { order: 2, name: 'Hinzufügen', url: '/admin/clubs/add' },
        ]}
      >
        <LoadingState message="Bereite Formular vor..." />
      </LayoutAdm>
    );
  }

  if (!user) {
    return (
      <LayoutAdm
        navData={[]}
        sectionTitle="Verein hinzufügen"
        breadcrumbs={[
          { order: 1, name: 'Vereine', url: '/admin/clubs' },
          { order: 2, name: 'Hinzufügen', url: '/admin/clubs/add' },
        ]}
      >
        <ErrorState message="Nicht autorisiert" />
      </LayoutAdm>
    );
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