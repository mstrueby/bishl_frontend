
import { useState, useEffect } from "react";
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { MatchValues } from '../../../types/MatchValues';
import Layout from "../../../components/Layout";
import SectionHeader from "../../../components/admin/SectionHeader";
import MatchCardRef from "../../../components/admin/MatchCardRef";
import apiClient from '../../../lib/apiClient';
import useAuth from '../../../hooks/useAuth';
import { UserRole } from '../../../lib/auth';
import usePermissions from '../../../hooks/usePermissions';
import LoadingState from '../../../components/ui/LoadingState';

const MyRef: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [matches, setMatches] = useState<MatchValues[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();

  // Auth redirect check
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!hasAnyRole([UserRole.REFEREE])) {
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
        
        // Filter matches assigned to current referee
        const myMatches = matchesData.filter((match: MatchValues) => 
          match.referee1?._id === user._id || 
          match.referee2?._id === user._id
        );
        
        setMatches(myMatches);
      } catch (error: any) {
        console.error('Error fetching matches:', error);
      } finally {
        setDataLoading(false);
      }
    };
    fetchMatches();
  }, [authLoading, user]);

  // Loading state
  if (authLoading || dataLoading) {
    return (
      <Layout>
        <SectionHeader title="Meine Spiele" />
        <LoadingState />
      </Layout>
    );
  }

  // Auth guard
  if (!hasAnyRole([UserRole.REFEREE])) return null;

  return (
    <Layout>
      <SectionHeader title="Meine Spiele" />

      <div className="mt-8 space-y-4">
        {matches.length === 0 ? (
          <p className="text-gray-500">Keine zugewiesenen Spiele gefunden.</p>
        ) : (
          matches.map((match) => (
            <MatchCardRef key={match._id} match={match} />
          ))
        )}
      </div>
    </Layout>
  );
}

export default MyRef;
