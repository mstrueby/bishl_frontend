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

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Auth redirect
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // Profile page is accessible to all authenticated users
    if (!hasAnyRole([UserRole.USER, UserRole.AUTHOR, UserRole.CLUB_MANAGER, UserRole.REFEREE, UserRole.LEAGUE_MANAGER, UserRole.ADMIN])) {
      router.push('/');
      return;
    }

    setIsAuthorized(true);
  }, [authLoading, user, hasAnyRole, router]);

  // Show loading state while checking auth
  if (authLoading || !isAuthorized) {
    return (
      <LayoutAdm
        mainNavData={[]}
        breadcrumbs={[{ order: 1, name: 'Profil', url: '/admin/profile' }]}
      >
        <LoadingState message="Lade Profil..." />
      </LayoutAdm>
    );
  }

  if (!user) {
    return (
      <LayoutAdm
        mainNavData={[]}
        breadcrumbs={[{ order: 1, name: 'Profil', url: '/admin/profile' }]}
      >
        <ErrorState message="Nicht angemeldet" />
      </LayoutAdm>
    );
  }

  return (
    <LayoutAdm
      mainNavData={[]}
      breadcrumbs={[{ order: 1, name: 'Profil', url: '/admin/profile' }]}
    >
      <Head>
        <title>Profil | BISHL</title>
      </Head>

      <div className="space-y-10 divide-y divide-gray-900/10">
        <ProfileForm user={user} />
      </div>
    </LayoutAdm>
  );
}