import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/20/solid';
import LayoutAdm from '../../../components/LayoutAdm';
import SearchBox from '../../../components/ui/SearchBox';
import DataList from '../../../components/admin/ui/DataList';
import useAuth from '../../../hooks/useAuth';
import usePermissions from '../../../hooks/usePermissions';
import apiClient from '../../../lib/apiClient';
import LoadingState from '../../../components/ui/LoadingState';
import ErrorState from '../../../components/ui/ErrorState';
import { UserRole } from '../../../lib/auth';
import { ClubValues } from '../../../types/ClubValues';

export default function ClubsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [clubs, setClubs] = useState<ClubValues[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<ClubValues[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth redirect
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (!hasAnyRole([UserRole.ADMIN, UserRole.LEAGUE_ADMIN])) {
      router.push('/');
      return;
    }

    setIsAuthorized(true);
  }, [authLoading, user, hasAnyRole, router]);

  // Fetch clubs data
  useEffect(() => {
    if (!isAuthorized) return;

    const fetchClubs = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/clubs');
        setClubs(response.data || []);
        setFilteredClubs(response.data || []);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching clubs:', err);
        setError(err.response?.data?.message || 'Fehler beim Laden der Vereine');
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, [isAuthorized]);

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredClubs(clubs);
      return;
    }

    const filtered = clubs.filter((club) =>
      club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.alias.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClubs(filtered);
  };

  // Show loading state while checking auth
  if (authLoading || !isAuthorized) {
    return (
      <LayoutAdm
        navData={[]}
        sectionTitle="Vereine"
        breadcrumbs={[{ order: 1, name: 'Vereine', url: '/admin/clubs' }]}
      >
        <LoadingState message="Lade Vereine..." />
      </LayoutAdm>
    );
  }

  return (
    <LayoutAdm
      navData={[]}
      sectionTitle="Vereine"
      breadcrumbs={[{ order: 1, name: 'Vereine', url: '/admin/clubs' }]}
    >
      <Head>
        <title>Vereine | BISHL Admin</title>
      </Head>

      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-semibold leading-6 text-gray-900">
            Vereine
          </h1>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href="/admin/clubs/add"
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="h-5 w-5 inline mr-1" aria-hidden="true" />
            Verein hinzufügen
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <SearchBox onSearch={handleSearch} placeholder="Vereine durchsuchen..." />
      </div>

      {loading ? (
        <LoadingState message="Lade Vereine..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="mt-8">
          <DataList
            items={filteredClubs.map((club) => ({
              id: club._id,
              name: club.name,
              alias: club.alias,
              editUrl: `/admin/clubs/${club.alias}/edit`,
              detailUrl: `/admin/clubs/${club.alias}/teams`,
            }))}
            emptyMessage="Keine Vereine gefunden"
          />
        </div>
      )}
    </LayoutAdm>
  );
}