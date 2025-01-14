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

let BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface MyRefProps {
  jwt: string;
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
    
    const user = userResponse.data;
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

    matches = matchesRes.data;
    assignments = assignmentsRes.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching data:', error);
    }
  }

  return {
    props: {
      jwt,
      initialMatches: matches || [],
      initialAssignments: assignments || []
    }
  };
};

const MyRef: NextPage<MyRefProps> = ({ jwt, initialMatches, initialAssignments }) => {
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

      setMatches(matchesRes.data);
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

      <ul>
        {matches && matches.length > 0 ? (
          matches.map((match: Match) => {
            const assignment = assignments.find((a: AssignmentValues) => a.matchId === match._id);
            return (
              <MatchCardRef
                key={match._id}
                match={match}
                assignment={assignment}
                jwt={jwt}
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