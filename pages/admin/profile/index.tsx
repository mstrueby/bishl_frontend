import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import LayoutAdm from '../../../components/LayoutAdm';
import ProfileForm from '../../../components/admin/ProfileForm';
import useAuth from '../../../hooks/useAuth';
import usePermissions from '../../../hooks/usePermissions';
import LoadingState from '../../../components/ui/LoadingState';
import ErrorState from '../../../components/ui/ErrorState';
import { UserRole } from '../../../lib/auth';
import { UserValues } from '../../../types/UserValues';
import apiClient from '../../../lib/apiClient';
import SuccessMessage from '../../../components/ui/SuccessMessage';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auth redirect
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // Profile page is accessible to all authenticated users
    if (!hasAnyRole([UserRole.USER, UserRole.AUTHOR, UserRole.CLUB_ADMIN, UserRole.REFEREE, UserRole.LEAGUE_ADMIN, UserRole.ADMIN])) {
      router.push('/');
      return;
    }

    setIsAuthorized(true);
  }, [authLoading, user, hasAnyRole, router]);

  const handleSubmit = async (values: any) => {
    setFormLoading(true);
    try {
      const updateData: any = {
        email: values.email,
      };
      
      if (values.password) {
        updateData.password = values.password;
      }
      
      await apiClient.patch(`/users/${user?._id}`, updateData);
      setSuccessMessage('Profil erfolgreich aktualisiert');
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin');
  };

  // Show loading state while checking auth
  if (authLoading || !isAuthorized) {
    return (
      <LayoutAdm
        navData={[]}
        sectionTitle="Profil"
        breadcrumbs={[{ order: 1, name: 'Profil', url: '/admin/profile' }]}
      >
        <LoadingState message="Lade Profil..." />
      </LayoutAdm>
    );
  }

  if (!user) {
    return (
      <LayoutAdm
        navData={[]}
        sectionTitle="Profil"
        breadcrumbs={[{ order: 1, name: 'Profil', url: '/admin/profile' }]}
      >
        <ErrorState message="Nicht angemeldet" />
      </LayoutAdm>
    );
  }

  return (
    <LayoutAdm
      navData={[]}
      sectionTitle="Profil"
      breadcrumbs={[{ order: 1, name: 'Profil', url: '/admin/profile' }]}
    >
      <Head>
        <title>Profil | BISHL</title>
      </Head>

      {successMessage && (
        <SuccessMessage message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}

      <div className="space-y-10 divide-y divide-gray-900/10">
        <ProfileForm
          initialValues={{ ...user, password: '', confirmPassword: '' }}
          onSubmit={handleSubmit}
          enableReinitialize={true}
          handleCancel={handleCancel}
          loading={formLoading}
        />
      </div>
    </LayoutAdm>
  );
}