import React from 'react';
import Head from "next/head";
import { GetServerSideProps } from 'next';
import { getCookie } from 'cookies-next';
import axios from 'axios';

import { Match } from '../../../types/MatchValues';
import { UserValues } from '../../../types/UserValues';
import Layout from "../../../components/Layout";
import SectionHeader from "../../../components/admin/SectionHeader";
import MatchCardRefAdmin from "../../../components/admin/MatchCardRefAdmin";

let BASE_URL = process.env.NEXT_PUBLIC_API_URL

interface RefAdminProps {
  jwt: string;
  initialMatches: Match[];
  referees: UserValues[];
}

interface FilterState {
  tournament: string;
  showUnassignedOnly: boolean;
  date_from?: string;
  date_to?: string;
}

const RefAdmin: React.FC<RefAdminProps> = ({ jwt, initialMatches, referees }) => {
  const [matches, setMatches] = React.useState<Match[]>(initialMatches);
  const [refereesData, setRefereesData] = React.useState<UserValues[]>(referees);
  const [matchAssignments, setMatchAssignments] = React.useState<{[key: string]: any}>({});
  const [filter, setFilter] = React.useState<FilterState>({ tournament: 'all', showUnassignedOnly: false });
  const sectionTitle = "Schiedsrichter einteilen";

  const fetchData = async (filterParams: FilterState) => {
    try {
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

      const matchesRes = await axios.get(`${BASE_URL}/matches`, { params });
      const matches = matchesRes.data;

      // Fetch assignments for each match
      const assignmentPromises = matches.map(match => 
        axios.get(`${BASE_URL}/assignments/matches/${match._id}`, {
          params: {
            assignmentStatus: ['AVAILABLE', 'REQUESTED']
          },
          headers: { Authorization: `Bearer ${jwt}` }
        })
      );

      const assignmentResults = await Promise.all(assignmentPromises);
      const assignmentsMap = assignmentResults.reduce((acc, result, index) => {
        acc[matches[index]._id] = result.data;
        return acc;
      }, {});

      setMatches(matches);
      setMatchAssignments(assignmentsMap);
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
      />
      
      <ul>
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);
  let matches = null;
  let referees = null;
  const currentDate = new Date().toISOString().split('T')[0];

  try {
    const [refereesRes, matchesRes] = await Promise.all([
      axios.get(`${BASE_URL}/users/referees`, {
        headers: { Authorization: `Bearer ${jwt}` }
      }),
      axios.get(`${BASE_URL}/matches`, {
        params: { date_from: currentDate }
      })
    ]);
    matches = matchesRes.data;
    referees = refereesRes.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching data:', error);
    }
    return { props: { referees: [], matches: [] } };
  }

  return {
    props: {
      jwt,
      initialMatches: matches || [],
      referees: referees || []
    }
  };
};

export default RefAdmin;