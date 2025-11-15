import { useState, useEffect } from "react";
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import axios from 'axios';
import { MatchValues } from '../../../types/MatchValues';
import Layout from "../../../components/Layout";
import SectionHeader from "../../../components/admin/SectionHeader";
import MatchCardRefAdmin from "../../../components/admin/MatchCardRefAdmin";
import RefMatchFilter from "../../../components/admin/RefMatchFilter";
import apiClient from '../../../lib/apiClient';
import useAuth from '../../../hooks/useAuth';
import { UserRole } from '../../../lib/auth';
import usePermissions from '../../../hooks/usePermissions';
import LoadingState from '../../../components/ui/LoadingState';

const RefAdmin: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [matches, setMatches] = useState<MatchValues[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<MatchValues[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
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

  // Data fetching
  useEffect(() => {
    if (authLoading || !user) return;

    const fetchMatches = async () => {
      try {
        const res = await apiClient.get('/matches');
        const matchesData = res.data || [];
        setMatches(matchesData);
        setFilteredMatches(matchesData);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Error fetching matches:', error);
        }
      } finally {
        setDataLoading(false);
      }
    };
    fetchMatches();
  }, [authLoading, user]);

  const handleFilterChange = (filtered: MatchValues[]) => {
    setFilteredMatches(filtered);
  };

  // Loading state
  if (authLoading || dataLoading) {
    return (
      <Layout>
        <SectionHeader title="Schiedsrichter Administration" />
        <LoadingState />
      </Layout>
    );
  }

  // Auth guard
  if (!hasAnyRole([UserRole.ADMIN])) return null;

  return (
    <Layout>
      <SectionHeader title="Schiedsrichter Administration" />

      <RefMatchFilter 
        matches={matches}
        onFilterChange={handleFilterChange}
      />

      <div className="mt-8 space-y-4">
        {filteredMatches.map((match) => (
          <MatchCardRefAdmin key={match._id} match={match} />
        ))}
      </div>
    </Layout>
  );
}

export default RefAdmin;