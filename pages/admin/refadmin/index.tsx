
import { useState, useEffect, useCallback } from "react";
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import axios from 'axios';
import { MatchValues } from '../../../types/MatchValues';
import { AssignmentValues } from '../../../types/AssignmentValues';
import { TournamentValues } from '../../../types/TournamentValues';
import Layout from "../../../components/Layout";
import SectionHeader from "../../../components/admin/SectionHeader";
import MatchCardRefAdmin from "../../../components/admin/MatchCardRefAdmin";
import RefMatchFilter from "../../../components/admin/RefMatchFilter";
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

const RefAdmin: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [matches, setMatches] = useState<MatchValues[]>([]);
  const [matchAssignments, setMatchAssignments] = useState<{ [key: string]: AssignmentValues[] }>({});
  const [tournaments, setTournaments] = useState<TournamentValues[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [filter, setFilter] = useState<FilterState>({ 
    tournament: 'all', 
    showUnassignedOnly: false,
    date_from: new Date().toISOString().split('T')[0]
  });
  const router = useRouter();

  // Auth redirect check
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (!hasAnyRole([UserRole.ADMIN, UserRole.REF_ADMIN])) {
      router.push('/');
    }
  }, [authLoading, user, hasAnyRole, router]);

  // Data fetching function
  const fetchData = useCallback(async (filterParams: FilterState) => {
    setDataLoading(true);
    try {
      // Build query parameters
      const params: any = {
        date_from: filterParams.date_from || new Date().toISOString().split('T')[0]
      };
      if (filterParams.date_to) params.date_to = filterParams.date_to;
      if (filterParams.tournament !== 'all') params.tournament = filterParams.tournament;
      if (filterParams.showUnassignedOnly) params.assigned = false;

      // Fetch matches
      const matchesRes = await apiClient.get('/matches', { params });

      if (!matchesRes.data || !Array.isArray(matchesRes.data)) {
        throw new Error('Invalid matches data received');
      }

      // Sort matches by date, venue, and time
      const sortedMatches = [...matchesRes.data].sort((a, b) => {
        // First sort by date only (ignore time component)
        const dateA = new Date(a.startDate).setHours(0, 0, 0, 0);
        const dateB = new Date(b.startDate).setHours(0, 0, 0, 0);
        
        if (dateA !== dateB) {
          return dateA - dateB;
        }
        
        // When dates are the same, sort by venue name to group matches by venue
        const venueA = a.venue.name.toLowerCase();
        const venueB = b.venue.name.toLowerCase();
        
        if (venueA !== venueB) {
          return venueA.localeCompare(venueB);
        }
        
        // Finally, for matches at the same venue on the same day, sort by time
        const timeA = new Date(a.startDate).getTime();
        const timeB = new Date(b.startDate).getTime();
        return timeA - timeB;
      });

      setMatches(sortedMatches);

      // Fetch assignments for each match if we have matches
      if (sortedMatches.length > 0) {
        const assignmentPromises = sortedMatches.map((match: MatchValues) =>
          apiClient.get(`/assignments/matches/${match._id}`, {
            params: {
              assignmentStatus: ['AVAILABLE', 'REQUESTED', 'ASSIGNED', 'ACCEPTED', 'UNAVAILABLE']
            }
          })
          .then(response => response)
          .catch(error => {
            console.error(`Error fetching assignments for match ${match._id}:`, error);
            return { data: [] }; // Return empty array on error for individual match
          })
        );

        const assignmentResults = await Promise.all(assignmentPromises);
        const assignmentsMap = assignmentResults.reduce((acc, result, index) => {
          if (result && Array.isArray(result.data)) {
            // Filter assignments to only include relevant statuses
            const filteredAssignments = result.data.filter((assignment: AssignmentValues) =>
              ['AVAILABLE', 'REQUESTED', 'ASSIGNED', 'ACCEPTED', 'UNAVAILABLE'].includes(assignment.status)
            );
            if (filteredAssignments.length > 0) {
              acc[sortedMatches[index]._id] = filteredAssignments.map((assignment: AssignmentValues) => ({
                ...assignment,
                position: assignment.position || 1
              }));
            }
          }
          return acc;
        }, {} as { [key: string]: AssignmentValues[] });

        setMatchAssignments(assignmentsMap);
      } else {
        setMatchAssignments({});
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setMatches([]);
      setMatchAssignments({});
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Fetch tournaments on mount
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await apiClient.get('/tournaments', {
          params: { active: true }
        });
        const tournamentsData = Array.isArray(response.data) ? response.data : [];
        setTournaments(tournamentsData);
      } catch (error) {
        console.error('Error fetching tournaments:', error);
        setTournaments([]);
      }
    };

    if (!authLoading && user && hasAnyRole([UserRole.ADMIN, UserRole.REF_ADMIN])) {
      fetchTournaments();
    }
  }, [authLoading, user, hasAnyRole]);

  // Data fetch when filter changes
  useEffect(() => {
    if (authLoading || !user) return;
    if (!hasAnyRole([UserRole.ADMIN, UserRole.REF_ADMIN])) return;

    fetchData(filter);
  }, [authLoading, user, hasAnyRole, filter, fetchData]);

  const handleFilterChange = useCallback((newFilter: FilterState) => {
    setFilter(newFilter);
  }, []);

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
  if (!hasAnyRole([UserRole.ADMIN, UserRole.REF_ADMIN])) return null;

  return (
    <Layout>
      <SectionHeader 
        title="Schiedsrichter Administration"
        filter="true"
        onFilterChange={handleFilterChange}
      />

      <div className="mt-8 space-y-4">
        {matches && matches.length > 0 ? (
          matches.map((match) => (
            <MatchCardRefAdmin 
              key={match._id} 
              match={match} 
              assignments={matchAssignments[match._id] || []}
            />
          ))
        ) : (
          <p className="text-center text-gray-500 mt-8">Keine Spiele vorhanden</p>
        )}
      </div>
    </Layout>
  );
}

export default RefAdmin;
