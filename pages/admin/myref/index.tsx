import Head from "next/head";
import { GetServerSideProps, NextPage } from 'next';
import axios from 'axios';
import Link from 'next/link';
import { getCookie } from 'cookies-next';
import Layout from "../../../components/Layout";
import { getFuzzyDate } from '../../../tools/dateUtils';
import { CldImage } from 'next-cloudinary';
import { Match } from '../../../types/MatchValues';
import SectionHeader from '../../../components/admin/SectionHeader';
import MatchCardRef from '../../../components/admin/MatchCardRef';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + "/matches/"

interface MyRefProps {
  jwt: string;
  matches: Match[];
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);
  let matches = null;
  const currentDate = new Date().toISOString().split('T')[0]; // Get the current date in YYYY-MM-DD format
  try {
    const res = await axios.get(BASE_URL, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      params: {
        date_from: currentDate,
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

  const sectionTitle= "Meine Schiedsrichtereinsätze";
  
  return (
    <Layout>
      <Head>
        <title>{sectionTitle}</title>
      </Head>
      <SectionHeader
        title={sectionTitle}
      />

      <ul>
        {matches && matches.length > 0 ? (
          matches.map((match: Match) => (
            <MatchCardRef key={match._id} match={match} />
          ))
        ) : (
          <p>Keine Spiele vorhanden</p>
        )}
      </ul>
    </Layout >
  );
};

export default MyRef;