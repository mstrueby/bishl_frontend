import Head from "next/head";
import { GetServerSideProps, NextPage } from 'next';
import axios from 'axios';
import Link from 'next/link';
import { getCookie } from 'cookies-next';
import Layout from "../../../components/Layout";
import { getFuzzyDate } from '../../../tools/dateUtils';
import { CldImage } from 'next-cloudinary';
import { Match } from '../../../types/MatchValues';


let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + "/matches/"

interface MyRefProps {
  jwt: string;
  matches: Match[];
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);
  let matches = null;
  try {
    const res = await axios.get(BASE_URL, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      }
    });
    matches = res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching matches:', error);
    }
  }
  return matches ? { props: { jwt, matches } } : { props: { jwt } };
};

const MyRef: NextPage<MyRefProps> = ({ jwt, matches }) => {

  return (
    <Layout>
      <Head>
        <title>Meine Schiedsrichtereinsätze</title>
      </Head>
      <div className="border-b border-gray-200 pb-5 sm:pb-0 mb-8">
        <h1 className="text-2xl/7 font-bold text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">Meine Schiedsrichtereinsätze</h1>
        <div className="mt-3 sm:mt-4" />
      </div>

      <ul>
        {matches && matches.length > 0 ? (
          matches.map((match: Match) => (
            <li key={match._id}>
              {match.home.fullName} vs {match.away.fullName}
            </li>
          ))
        ) : (
          <p>No matches found</p>
        )}
      </ul>
    </Layout >
  );
};

export default MyRef;