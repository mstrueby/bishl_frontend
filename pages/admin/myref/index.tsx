import { useState, useEffect, useCallback } from "react";
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { MatchValues } from '../../../types/MatchValues';
import { AssignmentValues } from '../../../types/AssignmentValues';
import { TournamentValues } from '../../../types/TournamentValues';
import Layout from "../../../components/Layout";
import SectionHeader from "../../../components/admin/SectionHeader";
import MatchCardRef from "../../../components/admin/MatchCardRef";
import apiClient from '../../../lib/apiClient';
import useAuth from '../../../hooks/useAuth';
import { UserRole } from '../../../lib/auth';
import usePermissions from '../../../hooks/usePermissions';
import LoadingState from '../../../components/ui/LoadingState';

interface FilterState {
  tournament: string;
  showUnassignedOnly: boolean;
  date_from?: string;
  date_to?: string;
}

const MyRef: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [matches, setMatches] = useState<MatchValues[]>([]);
  const [assignments, setAssignments] = useState<AssignmentValues[]>([]);
  const [tournaments, setTournaments] = useState<TournamentValues[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [filter, setFilter] = useState<FilterState>({
    tournament: 'all',
    showUnassignedOnly: false,
    date_from: new Date().toISOString().split('T')[0],
  });
  const router = useRouter();

  // Auth redirect
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (!hasAnyRole([UserRole.REFEREE])) { router.push('/'); }
  }, [authLoading, user, hasAnyRole, router]);

  const sortMatches = (raw: MatchValues[]): MatchValues[] =>
    [...raw].sort((a, b) => {
      const dateA = new Date(a.startDate).setHours(0, 0, 0, 0);
      const dateB = new Date(b.startDate).setHours(0, 0, 0, 0);
      if (dateA !== dateB) return dateA - dateB;
      const venueA = a.venue.name.toLowerCase();
      const venueB = b.venue.name.toLowerCase();
      if (venueA !== venueB) return venueA.localeCompare(venueB);
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

  const fetchData = useCallback(async (filterParams: FilterState) => {
    if (!user?._id) return;
    setDataLoading(true);
    try {
      const params: Record<string, any> = {
        date_from: filterParams.date_from || new Date().toISOString().split('T')[0],
      };
      if (filterParams.date_to) params.date_to = filterParams.date_to;
      if (filterParams.tournament !== 'all') params.tournament = filterParams.tournament;
      if (filterParams.showUnassignedOnly) params.assigned = false;

      const [matchesRes, assignmentsRes] = await Promise.all([
        apiClient.get('/matches', { params }),
        apiClient.get(`/assignments/users/${user._id}`),
      ]);

      setMatches(sortMatches(matchesRes.data || []));
      setAssignments(assignmentsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setDataLoading(false);
    }
  }, [user?._id]);

  // Fetch tournaments once
  useEffect(() => {
    if (authLoading || !user || !hasAnyRole([UserRole.REFEREE])) return;
    apiClient.get('/tournaments', { params: { active: true } })
      .then(res => setTournaments(Array.isArray(res.data) ? res.data : []))
      .catch(() => setTournaments([]));
  }, [authLoading, user, hasAnyRole]);

  // Fetch data when filter or user changes
  useEffect(() => {
    if (authLoading || !user || !hasAnyRole([UserRole.REFEREE])) return;
    fetchData(filter);
  }, [authLoading, user, hasAnyRole, filter, fetchData]);

  const handleFilterChange = useCallback((newFilter: FilterState) => {
    setFilter(newFilter);
  }, []);

  const handleBulkUpdate = useCallback(async (status: string) => {
    try {
      const promises = matches.map(match => {
        const assignment = assignments.find(a => a.matchId === match._id);
        if (assignment) {
          return apiClient.patch(`/assignments/${assignment._id}`, { status });
        } else {
          return apiClient.post('/assignments/', { matchId: match._id, status });
        }
      });
      await Promise.all(promises);
      await fetchData(filter);
    } catch (error) {
      console.error('Error in bulk update:', error);
    }
  }, [matches, assignments, filter, fetchData]);

  if (authLoading || dataLoading) {
    return (
      <Layout>
        <SectionHeader title="Meine Schiedsrichtereinsätze" />
        <LoadingState />
      </Layout>
    );
  }

  if (!hasAnyRole([UserRole.REFEREE])) return null;

  return (
    <Layout>
      <SectionHeader
        title="Meine Schiedsrichtereinsätze"
        filter="true"
        currentFilter={filter}
        tournaments={tournaments}
        onFilterChange={handleFilterChange}
        onBulkUpdate={handleBulkUpdate}
      />

      {/* Referee points */}
      <dl className="mx-auto grid grid-cols-1 gap-px bg-gray-900/5 sm:grid-cols-1 lg:grid-cols-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-white px-4 py-4 sm:px-6 xl:px-8">
          <dt className="text-sm/6 font-medium text-gray-500">Punkte</dt>
          <dd className="w-full flex-none text-3xl/10 font-medium tracking-tight text-gray-900">
            {user?.referee?.points ?? 0}
          </dd>
        </div>
      </dl>

      <ul className="mt-4">
        {matches.length > 0 ? (
          matches.map((match) => {
            const assignment = assignments.find(a => a.matchId === match._id);
            return (
              <MatchCardRef
                key={`${match._id}-${assignment?._id || 'new'}`}
                match={match}
                assignment={assignment}
              />
            );
          })
        ) : (
          <p className="text-center text-gray-500 mt-8">Keine Spiele vorhanden</p>
        )}
      </ul>
    </Layout>
  );
};

export default MyRef;
