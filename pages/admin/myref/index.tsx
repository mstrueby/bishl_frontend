import Head from "next/head";
import { useState, useEffect } from "react";
import { GetServerSideProps, NextPage } from 'next';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import Layout from "../../../components/Layout";
import { Match } from '../../../types/MatchValues';
import { AssignmentValues } from '../../../types/AssignmentValues';
import SectionHeader from '../../../components/admin/SectionHeader';
import MatchCardRef from '../../../components/admin/MatchCardRef';
import { UserValues } from "../../../types/UserValues";
import { classNames } from "../../../tools/utils"

let BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface MyRefProps {
  jwt: string;
  user: UserValues;
  initialMatches: Match[];
  initialAssignments: AssignmentValues[];
}

interface FilterState {
  tournament: string;
  showUnassignedOnly: boolean;
  date_from?: string;
  date_to?: string;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context) as string | undefined;
  let user = null;
  let matches = null;
  let assignments = null;
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
    // First check if user has REFEREE role
    const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });

    user = userResponse.data;
    if (!user.roles?.includes('REFEREE')) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }
    const userId = userResponse.data._id;

    const [matchesRes, assignmentsRes] = await Promise.all([
      axios.get(`${BASE_URL}/matches/`, {
        headers: { Authorization: `Bearer ${jwt}` },
        params: { date_from: currentDate }
      }),
      axios.get(`${BASE_URL}/assignments/users/${userId}`, {
        headers: { Authorization: `Bearer ${jwt}` }
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
    assignments = assignmentsRes.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching data:', error);
    }
  }

  return {
    props: {
      jwt,
      user,
      initialMatches: matches || [],
      initialAssignments: assignments || []
    }
  };
};

const MyRef: NextPage<MyRefProps> = ({ jwt, user, initialMatches, initialAssignments }) => {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [assignments, setAssignments] = useState<AssignmentValues[]>(initialAssignments);
  const [filter, setFilter] = useState<FilterState>({ tournament: 'all', showUnassignedOnly: false });
  const sectionTitle = "Meine Schiedsrichtereinsätze";

  const fetchData = async (filterParams: FilterState) => {
    try {
      const userRes = await axios.get(`${BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const userId = userRes.data._id;

      const params: any = {
        date_from: filterParams.date_from || new Date().toISOString().split('T')[0]
      };
      if (filterParams.date_to) {
        params.date_to = filterParams.date_to;
      }
      if (filterParams.tournament !== 'all') {
        params.tournament = filterParams.tournament;
      }
      if (filterParams.showUnassignedOnly) {
        params.assigned = false;
      }

      console.log(params);

      const [matchesRes, assignmentsRes] = await Promise.all([
        axios.get(`${BASE_URL}/matches/`, {
          headers: { Authorization: `Bearer ${jwt}` },
          params
        }),
        axios.get(`${BASE_URL}/assignments/users/${userId}`, {
          headers: { Authorization: `Bearer ${jwt}` }
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

      setMatches(sortedMatches);
      setAssignments(assignmentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
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
        onBulkUpdate={async (status) => {
          try {
            const promises = matches.map(match => {
              const assignment = assignments.find(a => a.matchId === match._id);
              const method = !assignment ? 'POST' : 'PATCH';
              const endpoint = !assignment ?
                `${BASE_URL}/assignments` :
                `${BASE_URL}/assignments/${assignment._id}`;
              const body = !assignment ?
                { matchId: match._id, status } :
                { status };

              return fetch(endpoint, {
                method,
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${jwt}`,
                },
                body: JSON.stringify(body)
              }).catch(() => null);
            });

            await Promise.all(promises);
            // Add delay to ensure backend has processed all updates
            await new Promise(resolve => setTimeout(resolve, 500));
            await fetchData(filter);
            setMatches([]); // Clear matches temporarily
            const refreshedData = await fetchData(filter); // Fetch fresh data
            return true; // Signal successful completion
          } catch (error) {
            console.error('Error in bulk update:', error);
            return false;
          }
        }}
      />

      {/** Einsätze und Punkte */}
      <dl className="mx-auto grid grid-cols-1 gap-px bg-gray-900/5 sm:grid-cols-1 lg:grid-cols-1">
        <div
          key="points"
          className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-white px-4 py-4 sm:px-6 xl:px-8"
        >
          <dt className="text-sm/6 font-medium text-gray-500">Punkte</dt>
          <dd className="w-full flex-none text-3xl/10 font-medium tracking-tight text-gray-900">{user.referee?.points}</dd>
        </div>
      </dl>

      <ul>
        {matches && matches.length > 0 ? (
          matches.map((match: Match) => {
            const assignment = assignments.find((a: AssignmentValues) => a.matchId === match._id);
            return (
              <MatchCardRef
                key={`${match._id}-${assignment?._id || 'new'}`}
                match={match}
                assignment={assignment}
                jwt={jwt}
              // Force re-render with a new key when assignment changes
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

export default MyRef;