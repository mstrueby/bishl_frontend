import React from 'react';
import Head from "next/head";
import { GetServerSideProps } from 'next';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import { Match } from '../../../types/MatchValues';
import Layout from "../../../components/Layout";
import SectionHeader from "../../../components/admin/SectionHeader";
import MatchCardRefAdmin from "../../../components/admin/MatchCardRefAdmin";
import { AssignmentValues } from '../../../types/AssignmentValues';

let BASE_URL = process.env.NEXT_PUBLIC_API_URL

interface RefAdminProps {
  jwt: string;
  initialMatches: Match[];
  initialAssignments: { [key: string]: AssignmentValues[] };
}

interface FilterState {
  tournament: string;
  showUnassignedOnly: boolean;
  date_from?: string;
  date_to?: string;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context) as string | undefined;
  let matches: Match[] = [];
  let assignments: { [key: string]: AssignmentValues[] } = {};
  const currentDate = new Date().toISOString().split('T')[0];

  if (!jwt) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  try {
    // First check if user has required role
    const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });

    const user = userResponse.data;
    if (!user.roles?.includes('REF_ADMIN') && !user.roles?.includes('ADMIN')) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }

    const [matchesRes] = await Promise.all([
      axios.get(`${BASE_URL}/matches/`, {
        params: { date_from: currentDate }
      })
    ]);
    
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
    
    matches = sortedMatches;

    
    const assignmentPromises = matches.map((match: Match) =>
      axios.get(`${BASE_URL}/assignments/matches/${match._id}`, {
        params: {
          assignmentStatus: ['AVAILABLE', 'REQUESTED', 'ASSIGNED', 'ACCEPTED', 'UNAVAILABLE']
        },
        headers: { Authorization: `Bearer ${jwt}` }
      })
    )
    const assignmentResults = await Promise.all(assignmentPromises);
    assignments = assignmentResults.reduce((acc, result, index) => {
      if (result && Array.isArray((result as any).data)) {
        // Only include AVAILABLE and REQUESTED assignments
        const filteredAssignments = result.data.filter((assignment: AssignmentValues) =>
          ['AVAILABLE', 'REQUESTED', 'ASSIGNED', 'ACCEPTED', 'UNAVAILABLE'].includes(assignment.status)
        );
        if (filteredAssignments.length > 0) {
          acc[matches[index]._id] = filteredAssignments.map((assignment: AssignmentValues) => ({
            ...assignment,
            refAdmin: true,
            position: assignment.position || 1
          })) as AssignmentValues[];
        }
      }
      return acc;
    }, {} as { [key: string]: AssignmentValues[] });
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching data:', error);
    }
    return { props: { initialMatches: [], initialAssignments: {} } };
  }

  return {
    props: {
      jwt,
      initialMatches: matches || [],
      initialAssignments: assignments || {}
    }
  };
};

const RefAdmin: React.FC<RefAdminProps> = ({ jwt, initialMatches, initialAssignments }) => {
  const [matches, setMatches] = React.useState<Match[]>(initialMatches);
  const [matchAssignments, setMatchAssignments] = React.useState<{ [key: string]: AssignmentValues[] }>(initialAssignments);
  const [filter, setFilter] = React.useState<FilterState>({ tournament: 'all', showUnassignedOnly: false });
  const sectionTitle = "Schiedsrichter einteilen";

  const fetchData = async (filterParams: FilterState) => {
    console.log("lets fetch data")
    try {
      // Build query parameters
      const params: any = {
        date_from: filterParams.date_from || new Date().toISOString().split('T')[0]
      };
      if (filterParams.date_to) params.date_to = filterParams.date_to;
      if (filterParams.tournament !== 'all') params.tournament = filterParams.tournament;
      if (filterParams.showUnassignedOnly) params.assigned = false;

      // Fetch matches with error handling
      const matchesRes = await axios.get(`${BASE_URL}/matches/`, {
        params
      });

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

      const matches = sortedMatches;

      // Only proceed with assignments if we have matches
      
      console.log("Matches length", matches.length)
      if (matches.length > 0) {
        // Fetch assignments for each match
        const assignmentPromises = matches.map((match: Match) =>
          axios.get(`${BASE_URL}/assignments/matches/${match._id}`, {
            params: {
              assignmentStatus: ['AVAILABLE', 'REQUESTED', 'ASSIGNED', 'ACCEPTED', 'UNAVAILABLE']
            },
            headers: { Authorization: `Bearer ${jwt}` }
          }).then(response => {
            if (response.data && Array.isArray(response.data) && response.data.length === 0) {
              console.log(`Empty assignments data for match ${match._id} at URL: ${BASE_URL}/assignments/matches/${match._id}`);
            }
            return response;
          }).catch(error => {
            console.error(`Error fetching assignments for match ${match._id}:`, error);
            return { data: [] }; // Return empty array on error for individual match
          })
        );
        
        const assignmentResults = await Promise.all(assignmentPromises);
        const assignmentsMap = assignmentResults.reduce((acc, result, index) => {
          if (result && Array.isArray(result.data)) {
            // Only include AVAILABLE and REQUESTED assignments
            const filteredAssignments = result.data.filter(assignment =>
              ['AVAILABLE', 'REQUESTED', 'ASSIGNED', 'UNAVAILABLE'].includes(assignment.status)
            );
            if (filteredAssignments.length > 0) {
              acc[matches[index]._id] = filteredAssignments.map(assignment => ({
                ...assignment,
                refAdmin: true,
                position: assignment.position || 1
              })) as AssignmentValues[];
            }
          }
          return acc;
        }, {} as { [key: string]: AssignmentValues[] });

        setMatchAssignments(assignmentsMap);
      } else {
        console.log('No matches found');
        setMatchAssignments({});
      }
      


      setMatches(matches);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMatches([]);
      setMatchAssignments({});
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          // Handle unauthorized error
          window.location.href = '/login';
        }
      }
    }
  };

  const handleFilterChange = (newFilter: FilterState) => {
    setFilter(newFilter);
    fetchData(newFilter);
  };

  return (
    <Layout>
      <Head>
        <title>{sectionTitle}</title>
      </Head>

      <SectionHeader
        title={sectionTitle}
        filter="true"
        onFilterChange={handleFilterChange}
      />

      <ul>
        {/*console.log('Match Assignments:', matchAssignments)} {/* Debugging line */}
        {matches && matches.length > 0 ? (
          matches.map((match: Match) => {
            return (
              <MatchCardRefAdmin
                key={match._id}
                match={match}
                jwt={jwt}
                assignments={matchAssignments[match._id] || []}
              />
            );
          })
        ) : (
          <p>Keine Spiele vorhanden</p>
        )}
      </ul>
    </Layout>
  );
};

export default RefAdmin;