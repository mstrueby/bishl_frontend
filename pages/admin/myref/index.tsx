
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

let BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/matches/";

interface MyRefProps {
  jwt: string;
  initialMatches: Match[];
  initialAssignments: AssignmentValues[];
}

interface FilterState {
  tournament: string;
  showUnassignedOnly: boolean;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);
  let matches = null;
  let assignments = null;
  const currentDate = new Date().toISOString().split('T')[0];

  try {
    const userRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    const userId = userRes.data._id;

    const [matchesRes, assignmentsRes] = await Promise.all([
      axios.get(BASE_URL, {
        headers: { Authorization: `Bearer ${jwt}` },
        params: { date_from: currentDate }
      }),
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/assignments/users/${userId}`, {
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
      const currentDate = new Date().toISOString().split('T')[0];
      const userRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const userId = userRes.data._id;

      const params: any = { date_from: currentDate };
      if (filterParams.tournament !== 'all') {
        params.tournament = filterParams.tournament;
      }
      if (filterParams.showUnassignedOnly) {
        params.assigned = false;
      }

      const [matchesRes, assignmentsRes] = await Promise.all([
        axios.get(BASE_URL, {
          headers: { Authorization: `Bearer ${jwt}` },
          params
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/assignments/users/${userId}`, {
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
