import Head from "next/head";
import { GetServerSideProps, NextPage } from 'next';
import axios from 'axios';
import Link from 'next/link';
import { getCookie } from 'cookies-next';
import Layout from "../../../components/Layout";
import { getFuzzyDate } from '../../../tools/dateUtils';
import { CldImage } from 'next-cloudinary';
import { Match } from '../../../types/MatchValues';
import { AssignmentValues } from '../../../types/AssignmentValues';
import SectionHeader from '../../../components/admin/SectionHeader';
import MatchCardRef from '../../../components/admin/MatchCardRef';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + "/matches/"

interface MyRefProps {
  jwt: string;
  matches: Match[];
  assignments: AssignmentValues[];
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);
  let matches = null;
  let assignments = null;
  const currentDate = new Date().toISOString().split('T')[0];

  try {
    // Get user ID
    const userRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    const userId = userRes.data._id;

    // Get matches and assignments in parallel
    const [matchesRes, assignmentsRes] = await Promise.all([
      axios.get(BASE_URL, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
        params: {
          date_from: currentDate,
        }
      }),
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/assignments/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        }
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
      matches: matches || [],
      assignments: assignments || []
    }
  };
};

const MyRef: NextPage<MyRefProps> = ({ jwt, matches, assignments }) => {
  const [filter, setFilter] = useState('all');
  const sectionTitle = "Meine Schiedsrichtereinsätze";

  const filteredMatches = matches.filter(match => {
    const assignment = assignments.find(a => a.matchId === match._id);
    switch (filter) {
      case 'available':
        return !assignment || assignment.status === 'AVAILABLE';
      case 'requested':
        return assignment?.status === 'REQUESTED';
      default:
        return true;
    }
  });

  return (
    <Layout>
      <Head>
        <title>{sectionTitle}</title>
      </Head>
      <SectionHeader
        title={sectionTitle}
        filter="true"
        onFilterChange={setFilter}
      />

      <ul>
        {filteredMatches && filteredMatches.length > 0 ? (
          filteredMatches.map((match: Match) => {
            const assignment = assignments.find((assignment: AssignmentValues) => assignment.matchId === match._id);
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
    </Layout >
  );
};

export default MyRef;