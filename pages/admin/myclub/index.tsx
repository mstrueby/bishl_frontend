import { useState, useEffect } from "react";
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import axios from 'axios';
import Layout from "../../../components/Layout";
import SectionHeader from "../../../components/admin/SectionHeader";
import apiClient from '../../../lib/apiClient';
import useAuth from '../../../hooks/useAuth';
import { UserRole } from '../../../lib/auth';
import usePermissions from '../../../hooks/usePermissions';
import LoadingState from '../../../components/ui/LoadingState';

const MyClub: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [teams, setTeams] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();

  // Auth redirect check
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (!hasAnyRole([UserRole.CLUB_ADMIN, UserRole.ADMIN])) {
      router.push('/');
    }
  }, [authLoading, user, hasAnyRole, router]);

  // Data fetching
  useEffect(() => {
    if (authLoading || !user) return;

    const fetchTeams = async () => {
      try {
        if (!user.club?.clubId) {
          setDataLoading(false);
          return;
        }

        const res = await apiClient.get(`/clubs/${user.club.clubId}/teams`);
        setTeams(res.data || []);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Error fetching teams:', error);
        }
      } finally {
        setDataLoading(false);
      }
    };
    fetchTeams();
  }, [authLoading, user]);

  // Loading state
  if (authLoading || dataLoading) {
    return (
      <Layout>
        <SectionHeader title="Mein Verein" />
        <LoadingState />
      </Layout>
    );
  }

  // Auth guard
  if (!hasAnyRole([UserRole.CLUB_ADMIN, UserRole.ADMIN])) return null;

  if (!user.club) {
    return (
      <Layout>
        <SectionHeader title="Mein Verein" />
        <p className="text-gray-500">Du bist keinem Verein zugeordnet.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <SectionHeader title={user.club.clubName} />

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Teams</h2>
        {teams.length === 0 ? (
          <p className="text-gray-500">Keine Teams gefunden.</p>
        ) : (
          <div className="space-y-2">
            {teams.map((team) => (
              <div
                key={team._id}
                className="p-4 bg-white rounded-lg shadow cursor-pointer hover:shadow-md transition"
                onClick={() => router.push(`/admin/myclub/${team.alias}`)}
              >
                <h3 className="font-medium">{team.name}</h3>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default MyClub;